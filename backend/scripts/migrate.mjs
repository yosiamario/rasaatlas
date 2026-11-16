/**
 * Jalankan migrasi database dari terminal.
 *   npm run migrate
 *
 * Skema awal ada di db/schema.sql; perubahan berikutnya diletakkan di
 * db/migrations/NNN_nama.sql dan otomatis ikut dijalankan.
 */
import 'dotenv/config'
import { closePool, databaseLabel, pool } from '../src/db.js'
import { applyMigrations, daftarMigrasi } from '../src/migrate.js'

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL belum diset. Isi backend/.env terlebih dahulu.')
  process.exit(1)
}

try {
  console.log(`Database: ${databaseLabel()}`)
  const { applied, skipped } = await applyMigrations((text, params) => pool.query(text, params))

  if (applied.length) {
    for (const version of applied) console.log(`✓ ${version}`)
    console.log(`Selesai: ${applied.length} migrasi baru diterapkan.`)
  } else {
    console.log(`Tidak ada migrasi baru (${skipped.length} versi sudah diterapkan).`)
  }
  console.log(`Total migrasi tersedia: ${daftarMigrasi().length}`)
} catch (error) {
  console.error('Migrasi gagal:', error.message)
  process.exitCode = 1
} finally {
  await closePool()
}
