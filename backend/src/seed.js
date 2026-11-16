/**
 * Isi database Supabase dari data/seed.json.
 * Jalankan: npm run seed (aman diulang) atau npm run seed:reset (hapus dulu).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { closePool, databaseLabel, ensureSchema, pool, query } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, '../data/seed.json'), 'utf8'))

export async function seedDatabase({ reset = false } = {}) {
  await ensureSchema()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (reset) {
      await client.query('TRUNCATE TABLE tempat, kategori, users RESTART IDENTITY CASCADE')
    }

    for (const k of seed.kategori) {
      await client.query(
        `INSERT INTO kategori (id, slug, nama, ikon, deskripsi)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           nama = EXCLUDED.nama,
           ikon = EXCLUDED.ikon,
           deskripsi = EXCLUDED.deskripsi`,
        [k.id, k.slug, k.nama, k.ikon, k.deskripsi],
      )
    }

    for (const t of seed.tempat) {
      await client.query(
        `INSERT INTO tempat
           (id, slug, nama, kategori_id, alamat, harga, rating, deskripsi, foto_url,
            lat, lng, jam_buka, populer, osm_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'approved')
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           nama = EXCLUDED.nama,
           kategori_id = EXCLUDED.kategori_id,
           alamat = EXCLUDED.alamat,
           harga = EXCLUDED.harga,
           rating = EXCLUDED.rating,
           deskripsi = EXCLUDED.deskripsi,
           foto_url = EXCLUDED.foto_url,
           lat = EXCLUDED.lat,
           lng = EXCLUDED.lng,
           jam_buka = EXCLUDED.jam_buka,
           populer = EXCLUDED.populer,
           osm_id = EXCLUDED.osm_id,
           status = 'approved'`,
        [
          t.id,
          t.slug,
          t.nama,
          t.kategori_id,
          t.alamat || 'Tidak diketahui',
          t.harga || 0,
          t.rating || 0,
          t.deskripsi || 'Belum ada deskripsi.',
          t.foto_url || '',
          t.lat ?? null,
          t.lng ?? null,
          t.jam_buka || 'Tidak diketahui',
          Boolean(t.populer),
          t.osm_id || null,
        ],
      )
    }

    for (const u of seed.users || []) {
      await client.query(
        `INSERT INTO users (nama, email, password_hash, nim, bio, role)
         VALUES ($1, $2, $3, $4, $5, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
        [u.nama, u.email, bcrypt.hashSync(u.password, 10), u.nim || '', u.bio || ''],
      )
    }

    // ID seed diisi eksplisit; samakan sequence agar tempat baru tidak bentrok.
    await client.query(
      `SELECT setval(
         pg_get_serial_sequence('tempat', 'id'),
         GREATEST(COALESCE((SELECT MAX(id) FROM tempat), 1), 1)
       )`,
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM tempat) AS tempat,
       (SELECT COUNT(*)::int FROM kategori) AS kategori,
       (SELECT COUNT(*)::int FROM users) AS pengguna`,
  )

  return {
    totalTempat: rows[0].tempat,
    totalKategori: rows[0].kategori,
    totalUser: rows[0].pengguna,
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const reset = process.argv.includes('--reset')
  try {
    const result = await seedDatabase({ reset })
    console.log(`Seed selesai → ${databaseLabel()}`)
    console.log(
      `  ${result.totalKategori} kategori, ${result.totalTempat} tempat, ${result.totalUser} pengguna`,
    )
  } catch (error) {
    console.error('Seed gagal:', error.message)
    process.exitCode = 1
  } finally {
    await closePool()
  }
}
