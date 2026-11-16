import { Router } from 'express'
import { query } from '../db.js'
import { mapTempat, mapUlasan } from '../mappers.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const BASE_SELECT = `
  SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon,
    u.nama AS kontributor,
    (SELECT COUNT(*)::int FROM ulasan ul WHERE ul.tempat_id = t.id) AS total_ulasan
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

async function slugTersedia(base, excludeId = null) {
  for (let i = 1; i <= 25; i += 1) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const { rows } = await query('SELECT id FROM tempat WHERE slug = $1', [candidate])
    if (!rows[0] || (excludeId && rows[0].id === excludeId)) return candidate
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
  if (
    fotoUrl &&
    !/^https?:\/\/\S+$/i.test(fotoUrl) &&
    !(fotoUrl.startsWith('/') && !fotoUrl.startsWith('//'))
  ) {
    return { error: 'URL foto harus diawali http(s):// atau berupa path /images/... /uploads/...' }
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
 * GET /tempat/saya — tempat yang ditambahkan oleh user login
 */
router.get('/saya', requireAuth, async (req, res) => {
  const { rows } = await query(
    `${BASE_SELECT} WHERE t.dibuat_oleh = $1 ORDER BY t.created_at DESC`,
    [req.user.id],
  )
  res.json({ data: rows.map(mapTempat) })
})

/**
 * GET /tempat/moderasi — daftar moderasi untuk admin
 */
router.get('/moderasi', requireAuth, requireAdmin, async (req, res) => {
  const status = String(req.query.status || 'pending').trim()
  let whereClause = ''
  const params = []

  if (status !== 'all') {
    whereClause = 'WHERE t.status = $1'
    params.push(status)
  }

  const { rows } = await query(
    `${BASE_SELECT} ${whereClause} ORDER BY t.created_at DESC`,
    params,
  )
  res.json({ data: rows.map(mapTempat) })
})

/**
 * GET /tempat
 * Filter: ?q=, ?kategori=<slug|id>, ?populer=1, ?min_rating=, ?max_harga=, ?status=
 * Urut:   ?sort=populer|rating|harga|harga_desc|nama|terbaru
 * Halaman: ?limit=24&offset=0
 */
router.get('/', optionalAuth, async (req, res) => {
  const where = []
  const values = []

  const push = (clause, value) => {
    if (value !== undefined) {
      values.push(value)
      where.push(clause.replaceAll('$P', `$${values.length}`))
    } else {
      where.push(clause)
    }
  }

  // Filter status: Jika bukan permintaan admin yang meminta status tertentu, hanya tampilkan yang approved
  // (atau kontribusi milik pengguna yang sedang login)
  const reqStatus = String(req.query.status || '').trim()
  if (reqStatus && req.user && req.user.role === 'admin') {
    if (reqStatus !== 'all') push('t.status = $P', reqStatus)
  } else if (req.user) {
    push("(t.status = 'approved' OR t.status IS NULL OR t.status = '' OR t.dibuat_oleh = $P)", req.user.id)
  } else {
    // Publik hanya melihat yang approved (atau yang kolom statusnya belum terisi / bawaan)
    push("(t.status = 'approved' OR t.status IS NULL OR t.status = '')")
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

  // Tandai apakah tempat disukai oleh pengguna yang sedang login
  let favoritSet = new Set()
  if (req.user) {
    const { rows: favRows } = await query(
      'SELECT tempat_id FROM favorit WHERE user_id = $1',
      [req.user.id],
    )
    favoritSet = new Set(favRows.map((f) => f.tempat_id))
  }

  res.json({
    data: rows.map((r) => mapTempat({ ...r, is_favorit: favoritSet.has(r.id) })),
    meta: { total: countResult.rows[0].n, limit, offset, sort: sortKey, q, kategori },
  })
})

/** GET /tempat/:id — id angka atau slug. */
router.get('/:id', optionalAuth, async (req, res) => {
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

  let isFavorit = false
  if (req.user) {
    const { rows: fav } = await query(
      'SELECT 1 FROM favorit WHERE user_id = $1 AND tempat_id = $2',
      [req.user.id, row.id],
    )
    isFavorit = fav.length > 0
  }

  const { rows: terkait } = await query(
    `${BASE_SELECT} WHERE t.kategori_id = $1 AND t.id <> $2 AND (t.status = 'approved' OR t.status IS NULL)
     ORDER BY t.populer DESC, t.rating DESC, t.nama ASC LIMIT 3`,
    [row.kategori_id, row.id],
  )

  res.json({
    data: mapTempat({ ...row, is_favorit: isFavorit }),
    terkait: terkait.map(mapTempat),
  })
})

/**
 * POST /tempat — kontribusi tempat baru dari pengguna yang sudah masuk.
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

  // Admin langsung approved; pengguna biasa berstatus 'pending' menunggu moderasi
  const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending'

  const simpan = async (slugValue) =>
    query(
      `INSERT INTO tempat
         (slug, nama, kategori_id, alamat, harga, rating, deskripsi, foto_url,
          lat, lng, jam_buka, populer, osm_id, dibuat_oleh, sumber, status)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, FALSE, NULL, $11, 'pengguna', $12)
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
        initialStatus,
      ],
    )

  let inserted
  try {
    inserted = await simpan(slug)
  } catch (error) {
    if (error.code !== '23505') throw error
    slug = `${base}-${Date.now().toString(36)}`
    inserted = await simpan(slug)
  }

  const { rows } = await query(`${BASE_SELECT} WHERE t.id = $1`, [inserted.rows[0].id])
  return res.status(201).json({ data: mapTempat(rows[0]) })
})

/**
 * PUT /tempat/:id — edit tempat sendiri atau oleh admin
 */
router.put('/:id', requireAuth, async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query('SELECT * FROM tempat WHERE id = $1', [Number(key)])
    : await query('SELECT * FROM tempat WHERE slug = $1', [key])

  const tempat = result.rows[0]
  if (!tempat) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const isAdmin = req.user.role === 'admin'
  const isOwner = tempat.dibuat_oleh === req.user.id
  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      error: { message: 'Anda tidak memiliki hak untuk mengedit tempat ini.', code: 'FORBIDDEN' },
    })
  }

  const hasil = validasiTempat(req.body)
  if (hasil.error) {
    return res.status(400).json({
      error: { message: hasil.error, code: 'VALIDATION' },
    })
  }

  const { nama, alamat, deskripsi, jamBuka, fotoUrl, harga, lat, lng } = hasil.value

  const kategoriRaw = String(req.body?.kategori_id ?? req.body?.kategori ?? tempat.kategori_id).trim()
  const kategoriResult = /^\d+$/.test(kategoriRaw)
    ? await query('SELECT id FROM kategori WHERE id = $1', [Number(kategoriRaw)])
    : await query('SELECT id FROM kategori WHERE slug = $1', [kategoriRaw])

  const kategori = kategoriResult.rows[0] || { id: tempat.kategori_id }

  // Perbarui slug bila nama berubah
  let slug = tempat.slug
  if (nama !== tempat.nama) {
    const base = slugify(nama) || `tempat-${Date.now().toString(36)}`
    slug = await slugTersedia(base, tempat.id)
  }

  // Jika tempat ditolak sebelumnya lalu diedit user, kembalikan ke status 'pending' agar bisa dimoderasi ulang
  let status = tempat.status
  if (!isAdmin && tempat.status === 'rejected') {
    status = 'pending'
  }

  const { rows } = await query(
    `UPDATE tempat
     SET nama = $1, kategori_id = $2, alamat = $3, harga = $4, deskripsi = $5,
         foto_url = $6, lat = $7, lng = $8, jam_buka = $9, slug = $10, status = $11
     WHERE id = $12
     RETURNING *`,
    [
      nama,
      kategori.id,
      alamat,
      harga,
      deskripsi,
      fotoUrl,
      lat,
      lng,
      jamBuka,
      slug,
      status,
      tempat.id,
    ],
  )

  const updatedResult = await query(`${BASE_SELECT} WHERE t.id = $1`, [rows[0].id])
  return res.json({ data: mapTempat(updatedResult.rows[0]) })
})

/**
 * DELETE /tempat/:id — hapus kontribusi tempat sendiri atau oleh admin
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query('SELECT * FROM tempat WHERE id = $1', [Number(key)])
    : await query('SELECT * FROM tempat WHERE slug = $1', [key])

  const tempat = result.rows[0]
  if (!tempat) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const isAdmin = req.user.role === 'admin'
  const isOwner = tempat.dibuat_oleh === req.user.id
  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      error: { message: 'Anda tidak memiliki hak untuk menghapus tempat ini.', code: 'FORBIDDEN' },
    })
  }

  await query('DELETE FROM tempat WHERE id = $1', [tempat.id])
  return res.json({ message: 'Tempat berhasil dihapus.' })
})

/**
 * PATCH /tempat/:id/moderasi — approve/reject tempat oleh admin
 */
router.patch('/:id/moderasi', requireAuth, requireAdmin, async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query('SELECT * FROM tempat WHERE id = $1', [Number(key)])
    : await query('SELECT * FROM tempat WHERE slug = $1', [key])

  const tempat = result.rows[0]
  if (!tempat) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const status = String(req.body?.status || '').trim().toLowerCase()
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({
      error: { message: "Status harus salah satu dari 'approved', 'rejected', atau 'pending'.", code: 'VALIDATION' },
    })
  }

  const catatan = String(req.body?.catatan_moderasi || '').trim()

  const { rows } = await query(
    `UPDATE tempat
     SET status = $1, catatan_moderasi = $2
     WHERE id = $3
     RETURNING *`,
    [status, catatan, tempat.id],
  )

  const updatedResult = await query(`${BASE_SELECT} WHERE t.id = $1`, [rows[0].id])
  return res.json({
    message: `Status moderasi berhasil diubah menjadi '${status}'.`,
    data: mapTempat(updatedResult.rows[0]),
  })
})

/* ---------------------------------------------------- ulasan & rating --- */

/** GET /tempat/:id/ulasan — daftar ulasan untuk tempat */
router.get('/:id/ulasan', async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query('SELECT id FROM tempat WHERE id = $1', [Number(key)])
    : await query('SELECT id FROM tempat WHERE slug = $1', [key])

  const tempat = result.rows[0]
  if (!tempat) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const { rows } = await query(
    `SELECT ul.*, u.nama AS user_nama, u.avatar_url AS user_avatar
     FROM ulasan ul
     JOIN users u ON u.id = ul.user_id
     WHERE ul.tempat_id = $1
     ORDER BY ul.created_at DESC`,
    [tempat.id],
  )

  return res.json({ data: rows.map(mapUlasan) })
})

/** POST /tempat/:id/ulasan — beri/perbarui ulasan dan rating tempat */
router.post('/:id/ulasan', requireAuth, async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query('SELECT id FROM tempat WHERE id = $1', [Number(key)])
    : await query('SELECT id FROM tempat WHERE slug = $1', [key])

  const tempat = result.rows[0]
  if (!tempat) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const rating = Number(req.body?.rating)
  const komentar = String(req.body?.komentar || '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: { message: 'Rating harus bilangan bulat 1 sampai 5 bintang.', code: 'VALIDATION' },
    })
  }
  if (komentar.length > 500) {
    return res.status(400).json({
      error: { message: 'Komentar ulasan maksimal 500 karakter.', code: 'VALIDATION' },
    })
  }

  const { rows } = await query(
    `INSERT INTO ulasan (tempat_id, user_id, rating, komentar)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tempat_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       komentar = EXCLUDED.komentar,
       updated_at = now()
     RETURNING *`,
    [tempat.id, req.user.id, rating, komentar],
  )

  // Hitung ulang rata-rata rating tempat
  await query(
    `UPDATE tempat
     SET rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM ulasan WHERE tempat_id = $1)
     WHERE id = $1`,
    [tempat.id],
  )

  const ulasanWithUser = await query(
    `SELECT ul.*, u.nama AS user_nama, u.avatar_url AS user_avatar
     FROM ulasan ul
     JOIN users u ON u.id = ul.user_id
     WHERE ul.id = $1`,
    [rows[0].id],
  )

  return res.status(201).json({
    message: 'Ulasan berhasil disimpan.',
    data: mapUlasan(ulasanWithUser.rows[0]),
  })
})

/** DELETE /tempat/:id/ulasan/:ulasanId — hapus ulasan */
router.delete('/:id/ulasan/:ulasanId', requireAuth, async (req, res) => {
  const ulasanId = Number(req.params.ulasanId)
  const { rows } = await query('SELECT * FROM ulasan WHERE id = $1', [ulasanId])
  const ulasan = rows[0]

  if (!ulasan) {
    return res.status(404).json({
      error: { message: 'Ulasan tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const isAdmin = req.user.role === 'admin'
  const isOwner = ulasan.user_id === req.user.id
  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      error: { message: 'Anda tidak memiliki hak untuk menghapus ulasan ini.', code: 'FORBIDDEN' },
    })
  }

  await query('DELETE FROM ulasan WHERE id = $1', [ulasanId])

  // Hitung ulang rating
  await query(
    `UPDATE tempat
     SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM ulasan WHERE tempat_id = $1), 0)
     WHERE id = $1`,
    [ulasan.tempat_id],
  )

  return res.json({ message: 'Ulasan berhasil dihapus.' })
})

export default router
