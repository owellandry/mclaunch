import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import fs from 'node:fs';

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'mclaunch.db');

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
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
  `);

  const settings = db.prepare("SELECT * FROM app_settings WHERE key = 'logo'").get();
  if (!settings) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run('logo', 'logo_gren.svg');
  }

  const langSetting = db.prepare("SELECT * FROM app_settings WHERE key = 'language'").get();
  if (!langSetting) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run('language', 'es');
  }

  const stats = db.prepare('SELECT * FROM statistics').get();
  if (!stats) {
    db.prepare('INSERT INTO statistics (win_rate, kda) VALUES (?, ?)').run(66.0, 3.15);
  }
  
  // Seed activity data if empty
  const activity = db.prepare('SELECT * FROM activity').get();
  if (!activity) {
    const dates = [
      '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', 
      '2026-04-05', '2026-04-06', '2026-04-07'
    ];
    const playTimes = [40, 70, 30, 90, 50, 20, 100];
    const stmt = db.prepare('INSERT INTO activity (date, play_time) VALUES (?, ?)');
    const transaction = db.transaction(() => {
      for (let i = 0; i < dates.length; i++) {
        stmt.run(dates[i], playTimes[i]);
      }
    });
    transaction();
  }
}

export function getWeeklyActivity(): number[] {
  const rows = db.prepare('SELECT play_time FROM activity ORDER BY id DESC LIMIT 7').all() as any[];
  // If fewer than 7, pad with 0s
  const times = rows.map(r => r.play_time).reverse();
  while (times.length < 7) times.unshift(0);
  return times;
}

export function getStatistics() {
  return db.prepare('SELECT win_rate, kda FROM statistics LIMIT 1').get();
}

export function getDownloadedVersions(): string[] {
  const rows = db.prepare('SELECT version FROM downloaded_versions').all() as any[];
  return rows.map(r => r.version);
}

export function addDownloadedVersion(version: string) {
  db.prepare('INSERT OR IGNORE INTO downloaded_versions (version, installed_at) VALUES (?, ?)').run(version, new Date().toISOString());
}

export function getLogo(): string {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'logo'").get() as any;
  return row ? row.value : 'logo_gren.svg';
}

export function setLogo(logo: string) {
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('logo', logo);
}

export function getLanguage(): string {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'language'").get() as any;
  return row ? row.value : 'es';
}

export function setLanguage(lang: string) {
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('language', lang);
}

export function clearCache() {
  const cachePath = path.join(userDataPath, 'Cache');
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
  }
}

export function clearAllData() {
  db.close();
  fs.rmSync(dbPath, { force: true });
}
