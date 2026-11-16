/**
 * Penjalan migrasi database.
 *
 * Urutan migrasi:
 *   001_init  -> db/schema.sql (skema awal, idempotent)
 *   002_...   -> db/migrations/*.sql (perubahan berikutnya, urut nama file)
 *
 * Setiap versi yang berhasil dijalankan dicatat di tabel `schema_migrations`,
 * jadi aman dijalankan berkali-kali (mis. setiap server start).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dbDir = join(dirname(fileURLToPath(import.meta.url)), '../db')
const migrationsDir = join(dbDir, 'migrations')
const INIT_VERSION = '001_init'

/** Daftar migrasi yang tersedia, sudah terurut. */
export function daftarMigrasi() {
  const files = [{ version: INIT_VERSION, file: join(dbDir, 'schema.sql') }]

  if (existsSync(migrationsDir)) {
    for (const name of readdirSync(migrationsDir).filter((n) => n.endsWith('.sql')).sort()) {
      files.push({ version: name.replace(/\.sql$/i, ''), file: join(migrationsDir, name) })
    }
  }

  return files
}

/**
 * Terapkan migrasi yang belum tercatat.
 * @param {(text: string, params?: unknown[]) => Promise<{ rows: any[] }>} run
 * @returns {Promise<{ applied: string[], skipped: string[] }>}
 */
export async function applyMigrations(run) {
  await run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // Sama seperti tabel lain: tutup akses anon/authenticated via PostgREST.
  await run('ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY')

  const { rows } = await run('SELECT version FROM schema_migrations')
  const sudah = new Set(rows.map((row) => row.version))

  const applied = []
  const skipped = []

  for (const migrasi of daftarMigrasi()) {
    if (sudah.has(migrasi.version)) {
      skipped.push(migrasi.version)
      continue
    }

    // File migrasi ditulis idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS),
    // sehingga kalau proses gagal di tengah, menjalankannya ulang tetap aman.
    await run(readFileSync(migrasi.file, 'utf8'))
    await run(
      'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
      [migrasi.version],
    )
    applied.push(migrasi.version)
  }

  return { applied, skipped }
}
