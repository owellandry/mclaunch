import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "mclaunch.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -64000");
db.pragma("temp_store = MEMORY");
db.pragma("mmap_size = 30000000000");
db.pragma("foreign_keys = ON");

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      play_time INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      win_rate REAL NOT NULL DEFAULT 0.0,
      kda REAL NOT NULL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS downloaded_versions (
      version TEXT PRIMARY KEY,
      installed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity(date);
    CREATE INDEX IF NOT EXISTS idx_downloaded_versions ON downloaded_versions(version);
  `);

  // Migración: limpiar datos de actividad falsos/legacy
  const migrated = db.prepare("SELECT 1 FROM app_settings WHERE key = 'activity_migrated_v2'").get();
  if (!migrated) {
    db.prepare("DELETE FROM activity").run();
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('activity_migrated_v2', '1')").run();
  }

  const logoExists = db.prepare("SELECT 1 FROM app_settings WHERE key = 'logo'").get();
  if (!logoExists) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run("logo", "logo_gren.svg");
  }

  const langExists = db.prepare("SELECT 1 FROM app_settings WHERE key = 'language'").get();
  if (!langExists) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run("language", "es");
  }

  const statsExists = db.prepare("SELECT 1 FROM statistics").get();
  if (!statsExists) {
    db.prepare("INSERT INTO statistics (win_rate, kda) VALUES (?, ?)").run(66.0, 3.15);
  }

}

export function addLauncherTime(seconds: number): void {
  if (seconds <= 0) return;
  const today = new Date().toISOString().split("T")[0];
  db.prepare("INSERT OR IGNORE INTO activity (date, play_time) VALUES (?, 0)").run(today);
  db.prepare("UPDATE activity SET play_time = play_time + ? WHERE date = ?").run(seconds, today);
}

export function getWeeklyActivity(): number[] {
  const result: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const row = db.prepare("SELECT play_time FROM activity WHERE date = ?").get(dateStr) as
      | { play_time: number }
      | undefined;
    result.push(row?.play_time ?? 0);
  }
  return result; // segundos reales, el frontend normaliza
}

type ActivityRow = {
  date: string;
  play_time: number;
};

const getIsoDate = (date: Date): string => date.toISOString().split("T")[0];

const buildDailyEntries = (days: number): Array<{ date: string; playTime: number }> => {
  const rows = db.prepare("SELECT date, play_time FROM activity").all() as ActivityRow[];
  const byDate = new Map(rows.map((row) => [row.date, row.play_time]));
  const entries: Array<{ date: string; playTime: number }> = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const dateKey = getIsoDate(date);
    entries.push({
      date: dateKey,
      playTime: byDate.get(dateKey) ?? 0,
    });
  }

  return entries;
};

const calculateCurrentStreakDays = (entries: Array<{ date: string; playTime: number }>): number => {
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i].playTime <= 0) break;
    streak += 1;
  }
  return streak;
};

const calculateLongestStreakDays = (rows: ActivityRow[]): number => {
  if (rows.length === 0) return 0;

  const byDate = new Map(rows.map((row) => [row.date, row.play_time]));
  const startDate = new Date(`${rows[0].date}T00:00:00`);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  let longest = 0;
  let current = 0;

  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const playTime = byDate.get(getIsoDate(cursor)) ?? 0;
    if (playTime > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
};

export function getActivityDetails(): {
  entries: Array<{ date: string; playTime: number }>;
  summary: {
    total_seconds_all_time: number;
    total_seconds_last_30_days: number;
    total_seconds_last_7_days: number;
    average_seconds_last_7_days: number;
    active_days_last_30_days: number;
    current_streak_days: number;
    longest_streak_days: number;
    best_day: { date: string; playTime: number } | null;
  };
} {
  const rows = (db.prepare("SELECT date, play_time FROM activity ORDER BY date ASC").all() as ActivityRow[]).filter(
    (row) => row.play_time > 0,
  );
  const last30Entries = buildDailyEntries(30);
  const last7Entries = last30Entries.slice(-7);
  const totalSecondsAllTime = rows.reduce((sum, row) => sum + row.play_time, 0);
  const totalSecondsLast30Days = last30Entries.reduce((sum, entry) => sum + entry.playTime, 0);
  const totalSecondsLast7Days = last7Entries.reduce((sum, entry) => sum + entry.playTime, 0);
  const activeDaysLast30Days = last30Entries.filter((entry) => entry.playTime > 0).length;
  const bestDayEntry = rows.reduce<ActivityRow | null>(
    (best, row) => (!best || row.play_time > best.play_time ? row : best),
    null,
  );

  return {
    entries: last30Entries,
    summary: {
      total_seconds_all_time: totalSecondsAllTime,
      total_seconds_last_30_days: totalSecondsLast30Days,
      total_seconds_last_7_days: totalSecondsLast7Days,
      average_seconds_last_7_days: Math.round(totalSecondsLast7Days / 7),
      active_days_last_30_days: activeDaysLast30Days,
      current_streak_days: calculateCurrentStreakDays(last30Entries),
      longest_streak_days: calculateLongestStreakDays(rows),
      best_day: bestDayEntry
        ? {
            date: bestDayEntry.date,
            playTime: bestDayEntry.play_time,
          }
        : null,
    },
  };
}

export type McStats = {
  mob_kills: number;
  deaths: number;
  blocks_mined: number;
  hours_played: number;
  play_seconds: number;
};

type WorldStats = {
  world_name: string;
  mob_kills: number;
  deaths: number;
  blocks_mined: number;
  play_ticks: number;
  play_seconds: number;
  hours_played: number;
  last_played_at: string | null;
};

const roundNumber = (value: number, decimals = 2): number => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
};

const getMinecraftWorldStats = (gameDir: string, uuid: string): WorldStats[] => {
  const savesDir = path.join(gameDir, "saves");
  if (!fs.existsSync(savesDir)) return [];

  const uuidDashed =
    uuid.length === 32
      ? `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`
      : uuid;

  const worlds: WorldStats[] = [];

  try {
    for (const entry of fs.readdirSync(savesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const worldPath = path.join(savesDir, entry.name);
      const statsFile = path.join(worldPath, "stats", `${uuidDashed}.json`);
      if (!fs.existsSync(statsFile)) continue;

      try {
        const raw = JSON.parse(fs.readFileSync(statsFile, "utf8")) as {
          stats?: {
            "minecraft:custom"?: Record<string, number>;
            "minecraft:mined"?: Record<string, number>;
          };
        };
        const custom = raw?.stats?.["minecraft:custom"] ?? {};
        const mined = raw?.stats?.["minecraft:mined"] ?? {};
        const playTicks = custom["minecraft:play_time"] ?? 0;
        const playSeconds = Math.floor(playTicks / 20);
        const hoursPlayed = roundNumber(playSeconds / 3600, 1);

        worlds.push({
          world_name: entry.name,
          mob_kills: custom["minecraft:mob_kills"] ?? 0,
          deaths: custom["minecraft:deaths"] ?? 0,
          blocks_mined: Object.values(mined).reduce((a, v) => a + v, 0),
          play_ticks: playTicks,
          play_seconds: playSeconds,
          hours_played: hoursPlayed,
          last_played_at: fs.statSync(worldPath).mtime.toISOString(),
        });
      } catch {
        // archivo corrupto, se ignora
      }
    }
  } catch {
    return [];
  }

  return worlds.sort((a, b) => b.play_ticks - a.play_ticks);
};

export function getMinecraftStats(gameDir: string, uuid: string): McStats {
  const worlds = getMinecraftWorldStats(gameDir, uuid);
  const totals = worlds.reduce(
    (acc, world) => ({
      mob_kills: acc.mob_kills + world.mob_kills,
      deaths: acc.deaths + world.deaths,
      blocks_mined: acc.blocks_mined + world.blocks_mined,
      play_ticks: acc.play_ticks + world.play_ticks,
    }),
    { mob_kills: 0, deaths: 0, blocks_mined: 0, play_ticks: 0 },
  );

  return {
    mob_kills: totals.mob_kills,
    deaths: totals.deaths,
    blocks_mined: totals.blocks_mined,
    hours_played: roundNumber(totals.play_ticks / 20 / 3600, 1),
    play_seconds: Math.floor(totals.play_ticks / 20),
  };
}

export function getDetailedMinecraftStats(
  gameDir: string,
  uuid: string,
): {
  summary: {
    mob_kills: number;
    deaths: number;
    blocks_mined: number;
    hours_played: number;
    play_seconds: number;
    worlds_tracked: number;
    kill_death_ratio: number;
    blocks_per_hour: number;
    kills_per_hour: number;
  };
  worlds: Array<{
    world_name: string;
    mob_kills: number;
    deaths: number;
    blocks_mined: number;
    hours_played: number;
    play_seconds: number;
    last_played_at: string | null;
  }>;
} {
  const worlds = getMinecraftWorldStats(gameDir, uuid);
  const totalPlaySeconds = worlds.reduce((sum, world) => sum + world.play_seconds, 0);
  const totalHoursExact = totalPlaySeconds / 3600;
  const totals = worlds.reduce(
    (acc, world) => ({
      mob_kills: acc.mob_kills + world.mob_kills,
      deaths: acc.deaths + world.deaths,
      blocks_mined: acc.blocks_mined + world.blocks_mined,
      hours_played: acc.hours_played + world.hours_played,
    }),
    { mob_kills: 0, deaths: 0, blocks_mined: 0, hours_played: 0 },
  );

  return {
    summary: {
      mob_kills: totals.mob_kills,
      deaths: totals.deaths,
      blocks_mined: totals.blocks_mined,
      hours_played: roundNumber(totalHoursExact, 1),
      play_seconds: totalPlaySeconds,
      worlds_tracked: worlds.length,
      kill_death_ratio: totals.deaths > 0 ? roundNumber(totals.mob_kills / totals.deaths, 2) : totals.mob_kills,
      blocks_per_hour: totalHoursExact > 0 ? roundNumber(totals.blocks_mined / totalHoursExact, 1) : 0,
      kills_per_hour: totalHoursExact > 0 ? roundNumber(totals.mob_kills / totalHoursExact, 1) : 0,
    },
    worlds: worlds.map(({ play_ticks: _playTicks, ...world }) => world),
  };
}

export function getDownloadedVersions(): string[] {
  const rows = db.prepare("SELECT version FROM downloaded_versions").all() as { version: string }[];
  return rows.map((row) => row.version);
}

export function getDownloadedVersionEntries(): Array<{ version: string; installed_at: string }> {
  return db
    .prepare("SELECT version, installed_at FROM downloaded_versions ORDER BY installed_at DESC")
    .all() as Array<{ version: string; installed_at: string }>;
}

export function getStatistics(): { win_rate: number; kda: number } {
  const row = db.prepare("SELECT win_rate, kda FROM statistics ORDER BY id ASC LIMIT 1").get() as
    | { win_rate: number; kda: number }
    | undefined;

  return row ?? { win_rate: 0, kda: 0 };
}

export function addDownloadedVersion(version: string): void {
  db.prepare("INSERT OR IGNORE INTO downloaded_versions (version, installed_at) VALUES (?, ?)")
    .run(version, new Date().toISOString());
}

export function syncDownloadedVersions(gameDir: string): string[] {
  const versionsDir = path.join(gameDir, "versions");
  if (!fs.existsSync(versionsDir)) {
    return getDownloadedVersions();
  }

  try {
    for (const entry of fs.readdirSync(versionsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const jarPath = path.join(versionsDir, entry.name, `${entry.name}.jar`);
      if (fs.existsSync(jarPath)) {
        addDownloadedVersion(entry.name);
      }
    }
  } catch {
    return getDownloadedVersions();
  }

  return getDownloadedVersions();
}

export function getLogo(): string {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'logo'").get() as
    | { value: string }
    | undefined;
  return row?.value ?? "logo_gren.svg";
}

export function setLogo(logo: string): void {
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("logo", logo);
}

export function getLanguage(): string {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'language'").get() as
    | { value: string }
    | undefined;
  return row?.value ?? "es";
}

export function setLanguage(lang: string): void {
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run("language", lang);
}

export function clearCache(): void {
  const cachePath = path.join(userDataPath, "Cache");
  if (!fs.existsSync(cachePath)) {
    return;
  }

  try {
    fs.rmSync(cachePath, { recursive: true, force: true });
  } catch (error) {
    throw new Error(`No se pudo limpiar la cache de Electron: ${String(error)}`);
  }
}

export function clearAllData(): void {
  try {
    db.close();
    fs.rmSync(dbPath, { force: true });
  } catch (error) {
    throw new Error(`No se pudieron borrar los datos de la aplicacion: ${String(error)}`);
  }
}
