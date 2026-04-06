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

  const activityExists = db.prepare("SELECT 1 FROM activity LIMIT 1").get();
  if (!activityExists) {
    const dates = [
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
      "2026-04-04",
      "2026-04-05",
      "2026-04-06",
      "2026-04-07",
    ];
    const playTimes = [40, 70, 30, 90, 50, 20, 100];

    const stmt = db.prepare("INSERT INTO activity (date, play_time) VALUES (?, ?)");
    const transaction = db.transaction(() => {
      for (let i = 0; i < dates.length; i += 1) {
        stmt.run(dates[i], playTimes[i]);
      }
    });

    transaction();
  }
}

export function getWeeklyActivity(): number[] {
  const rows = db
    .prepare("SELECT play_time FROM activity ORDER BY date DESC LIMIT 7")
    .all() as { play_time: number }[];
  const times = rows.map((row) => row.play_time).reverse();

  while (times.length < 7) {
    times.unshift(0);
  }

  return times;
}

export function getStatistics(): { win_rate: number; kda: number } {
  return db.prepare("SELECT win_rate, kda FROM statistics LIMIT 1").get() as {
    win_rate: number;
    kda: number;
  };
}

export function getDownloadedVersions(): string[] {
  const rows = db.prepare("SELECT version FROM downloaded_versions").all() as { version: string }[];
  return rows.map((row) => row.version);
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
