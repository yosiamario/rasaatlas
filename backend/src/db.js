import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultPath = resolve(__dirname, '../data/rasaatlas.db')
const dbPath = process.env.DB_PATH ? resolve(process.cwd(), process.env.DB_PATH) : defaultPath

mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS kategori (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    ikon TEXT NOT NULL DEFAULT '🍽️',
    deskripsi TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS tempat (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES kategori(id),
    alamat TEXT NOT NULL DEFAULT 'Tidak diketahui',
    harga INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    deskripsi TEXT NOT NULL DEFAULT 'Belum ada deskripsi.',
    foto_url TEXT NOT NULL DEFAULT '',
    lat REAL,
    lng REAL,
    jam_buka TEXT NOT NULL DEFAULT 'Tidak diketahui',
    populer INTEGER NOT NULL DEFAULT 0,
    osm_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nim TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tempat_kategori ON tempat (kategori_id);
  CREATE INDEX IF NOT EXISTS idx_tempat_nama ON tempat (nama);
`)

export { dbPath }
