/**
 * Isi database dari data/seed.json.
 * Jalankan: npm run seed (aman diulang) atau npm run seed:reset (hapus dulu).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { db, dbPath } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, '../data/seed.json'), 'utf8'))

const upsertKategori = db.prepare(`
  INSERT INTO kategori (id, slug, nama, ikon, deskripsi)
  VALUES (@id, @slug, @nama, @ikon, @deskripsi)
  ON CONFLICT(id) DO UPDATE SET
    slug = excluded.slug,
    nama = excluded.nama,
    ikon = excluded.ikon,
    deskripsi = excluded.deskripsi
`)

const upsertTempat = db.prepare(`
  INSERT INTO tempat
    (id, slug, nama, kategori_id, alamat, harga, rating, deskripsi, foto_url, lat, lng, jam_buka, populer, osm_id)
  VALUES
    (@id, @slug, @nama, @kategori_id, @alamat, @harga, @rating, @deskripsi, @foto_url, @lat, @lng, @jam_buka, @populer, @osm_id)
  ON CONFLICT(id) DO UPDATE SET
    slug = excluded.slug,
    nama = excluded.nama,
    kategori_id = excluded.kategori_id,
    alamat = excluded.alamat,
    harga = excluded.harga,
    rating = excluded.rating,
    deskripsi = excluded.deskripsi,
    foto_url = excluded.foto_url,
    lat = excluded.lat,
    lng = excluded.lng,
    jam_buka = excluded.jam_buka,
    populer = excluded.populer,
    osm_id = excluded.osm_id
`)

const findUser = db.prepare('SELECT id FROM users WHERE email = ?')
const insertUser = db.prepare(`
  INSERT INTO users (nama, email, password_hash, nim, bio)
  VALUES (@nama, @email, @password_hash, @nim, @bio)
`)

export function seedDatabase({ reset = false } = {}) {
  const run = db.transaction(() => {
    if (reset) db.exec('DELETE FROM tempat; DELETE FROM kategori; DELETE FROM users;')

    for (const k of seed.kategori) upsertKategori.run(k)
    for (const t of seed.tempat) {
      upsertTempat.run({
        ...t,
        alamat: t.alamat || 'Tidak diketahui',
        deskripsi: t.deskripsi || 'Belum ada deskripsi.',
        jam_buka: t.jam_buka || 'Tidak diketahui',
        foto_url: t.foto_url || '',
        populer: t.populer ? 1 : 0,
        osm_id: t.osm_id || null,
      })
    }
    for (const u of seed.users || []) {
      if (findUser.get(u.email)) continue
      insertUser.run({
        nama: u.nama,
        email: u.email,
        password_hash: bcrypt.hashSync(u.password, 10),
        nim: u.nim || '',
        bio: u.bio || '',
      })
    }
  })

  run()

  const totalTempat = db.prepare('SELECT COUNT(*) AS n FROM tempat').get().n
  const totalKategori = db.prepare('SELECT COUNT(*) AS n FROM kategori').get().n
  const totalUser = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  return { totalTempat, totalKategori, totalUser }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const reset = process.argv.includes('--reset')
  const result = seedDatabase({ reset })
  console.log(`Seed selesai → ${dbPath}`)
  console.log(
    `  ${result.totalKategori} kategori, ${result.totalTempat} tempat, ${result.totalUser} pengguna`,
  )
}
