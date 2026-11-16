import { Router } from 'express'
import { query } from '../db.js'
import { mapTempat } from '../mappers.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const BASE_SELECT = `
  SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon,
    u.nama AS kontributor
  FROM tempat t
  JOIN kategori k ON k.id = t.kategori_id
  LEFT JOIN users u ON u.id = t.dibuat_oleh
`

const SORTS = {
  populer: 't.populer DESC, t.rating DESC',
  rating: 't.rating DESC, t.nama ASC',
  rating_asc: 't.rating ASC, t.nama ASC',
  harga: 't.harga ASC, t.nama ASC',
  harga_desc: 't.harga DESC, t.nama ASC',
  nama: 't.nama ASC',
  terbaru: 't.created_at DESC, t.id DESC',
}

/**
 * GET /tempat
 * Filter: ?q=, ?kategori=<slug|id>, ?populer=1, ?min_rating=, ?max_harga=
 * Urut:   ?sort=populer|rating|harga|harga_desc|nama|terbaru
 * Halaman: ?limit=24&offset=0
 */
router.get('/', async (req, res) => {
  const where = []
  const values = []

  const push = (clause, value) => {
    values.push(value)
    where.push(clause.replaceAll('$P', `$${values.length}`))
  }

  const q = String(req.query.q || '').trim()
  if (q) {
    push('(t.nama ILIKE $P OR t.alamat ILIKE $P OR t.deskripsi ILIKE $P)', `%${q}%`)
  }

  const kategori = String(req.query.kategori || '').trim()
  if (kategori) {
    if (/^\d+$/.test(kategori)) push('t.kategori_id = $P', Number(kategori))
    else push('k.slug = $P', kategori)
  }

  if (req.query.populer === '1' || req.query.populer === 'true') {
    where.push('t.populer = TRUE')
  }

  const minRating = Number(req.query.min_rating)
  if (Number.isFinite(minRating) && minRating > 0) {
    push('t.rating >= $P', minRating)
  }

  const maxHarga = Number(req.query.max_harga)
  if (Number.isFinite(maxHarga) && maxHarga > 0) {
    push('t.harga <= $P', maxHarga)
  }

  const requestedSort = String(req.query.sort || 'populer')
  const sortKey = SORTS[requestedSort] ? requestedSort : 'populer'
  const orderBy = SORTS[sortKey]

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const countResult = await query(
    `SELECT COUNT(*)::int AS n FROM tempat t JOIN kategori k ON k.id = t.kategori_id ${whereSql}`,
    values,
  )

  const rowValues = [...values, limit, offset]
  const { rows } = await query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${orderBy}
     LIMIT $${rowValues.length - 1} OFFSET $${rowValues.length}`,
    rowValues,
  )

  res.json({
    data: rows.map(mapTempat),
    meta: { total: countResult.rows[0].n, limit, offset, sort: sortKey, q, kategori },
  })
})

/** GET /tempat/:id — id angka atau slug. */
router.get('/:id', async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query(`${BASE_SELECT} WHERE t.id = $1`, [Number(key)])
    : await query(`${BASE_SELECT} WHERE t.slug = $1`, [key])

  const row = result.rows[0]
  if (!row) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const { rows: terkait } = await query(
    `${BASE_SELECT} WHERE t.kategori_id = $1 AND t.id <> $2
     ORDER BY t.populer DESC, t.rating DESC, t.nama ASC LIMIT 3`,
    [row.kategori_id, row.id],
  )

  res.json({ data: mapTempat(row), terkait: terkait.map(mapTempat) })
})

/* ------------------------------------------------------- tambah tempat --- */

const LAT_BATAS = { min: -90, max: 90 }
const LNG_BATAS = { min: -180, max: 180 }

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '')
}

async function slugTersedia(base) {
  for (let i = 1; i <= 25; i += 1) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const { rowCount } = await query('SELECT 1 FROM tempat WHERE slug = $1', [candidate])
    if (rowCount === 0) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

function validasiTempat(body) {
  const nama = String(body?.nama || '').trim()
  const alamat = String(body?.alamat || '').trim()
  const deskripsi = String(body?.deskripsi || '').trim()
  const jamBuka = String(body?.jam_buka || '').trim()
  const fotoUrl = String(body?.foto_url || '').trim()

  if (nama.length < 2 || nama.length > 80) {
    return { error: 'Nama tempat harus 2–80 karakter.' }
  }
  if (alamat.length < 5 || alamat.length > 200) {
    return { error: 'Alamat harus 5–200 karakter.' }
  }
  if (deskripsi.length > 500) {
    return { error: 'Deskripsi maksimal 500 karakter.' }
  }
  if (jamBuka.length > 100) {
    return { error: 'Jam buka maksimal 100 karakter.' }
  }
  if (fotoUrl.length > 500) {
    return { error: 'URL foto maksimal 500 karakter.' }
  }
  if (fotoUrl && !/^https?:\/\/\S+$/i.test(fotoUrl) && !(fotoUrl.startsWith('/') && !fotoUrl.startsWith('//'))) {
    return { error: 'URL foto harus diawali http(s):// atau berupa path /images/...' }
  }

  const harga = Number(body?.harga ?? 0)
  if (!Number.isFinite(harga) || !Number.isInteger(harga) || harga < 0 || harga > 10_000_000) {
    return { error: 'Harga harus bilangan bulat antara 0 dan 10.000.000.' }
  }

  const hasLat = body?.lat !== undefined && body?.lat !== null && String(body.lat).trim() !== ''
  const hasLng = body?.lng !== undefined && body?.lng !== null && String(body.lng).trim() !== ''
  if (hasLat !== hasLng) {
    return { error: 'Isi latitude dan longitude sekaligus, atau kosongkan keduanya.' }
  }

  let lat = null
  let lng = null
  if (hasLat) {
    lat = Number(body.lat)
    lng = Number(body.lng)
    if (!Number.isFinite(lat) || lat < LAT_BATAS.min || lat > LAT_BATAS.max) {
      return { error: 'Latitude tidak valid.' }
    }
    if (!Number.isFinite(lng) || lng < LNG_BATAS.min || lng > LNG_BATAS.max) {
      return { error: 'Longitude tidak valid.' }
    }
  }

  return {
    value: {
      nama,
      alamat,
      deskripsi: deskripsi || 'Belum ada deskripsi.',
      jamBuka: jamBuka || 'Tidak diketahui',
      fotoUrl,
      harga,
      lat,
      lng,
    },
  }
}

/**
 * POST /tempat — kontribusi tempat baru dari pengguna yang sudah masuk.
 * Rating tidak diterima dari klien (tempat baru tampil sebagai "Baru").
 */
router.post('/', requireAuth, async (req, res) => {
  const hasil = validasiTempat(req.body)
  if (hasil.error) {
    return res.status(400).json({
      error: { message: hasil.error, code: 'VALIDATION' },
    })
  }

  const { nama, alamat, deskripsi, jamBuka, fotoUrl, harga, lat, lng } = hasil.value

  const kategoriRaw = String(req.body?.kategori_id ?? req.body?.kategori ?? '').trim()
  if (!kategoriRaw) {
    return res.status(400).json({
      error: { message: 'Pilih kategori tempat terlebih dahulu.', code: 'VALIDATION' },
    })
  }

  const kategoriResult = /^\d+$/.test(kategoriRaw)
    ? await query('SELECT id FROM kategori WHERE id = $1', [Number(kategoriRaw)])
    : await query('SELECT id FROM kategori WHERE slug = $1', [kategoriRaw])

  const kategori = kategoriResult.rows[0]
  if (!kategori) {
    return res.status(400).json({
      error: { message: 'Kategori tidak ditemukan.', code: 'VALIDATION' },
    })
  }

  const base = slugify(nama) || `tempat-${Date.now().toString(36)}`
  let slug = await slugTersedia(base)

  const simpan = async (slugValue) =>
    query(
      `INSERT INTO tempat
         (slug, nama, kategori_id, alamat, harga, rating, deskripsi, foto_url,
          lat, lng, jam_buka, populer, osm_id, dibuat_oleh, sumber)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, FALSE, NULL, $11, 'pengguna')
       RETURNING id`,
      [
        slugValue,
        nama,
        kategori.id,
        alamat,
        harga,
        deskripsi,
        fotoUrl,
        lat,
        lng,
        jamBuka,
        req.user.id,
      ],
    )

  let inserted
  try {
    inserted = await simpan(slug)
  } catch (error) {
    // Tabrakan slug sangat jarang, tetapi tetap ditangani.
    if (error.code !== '23505') throw error
    slug = `${base}-${Date.now().toString(36)}`
    inserted = await simpan(slug)
  }

  const { rows } = await query(`${BASE_SELECT} WHERE t.id = $1`, [inserted.rows[0].id])

  return res.status(201).json({ data: mapTempat(rows[0]) })
})

export default router
