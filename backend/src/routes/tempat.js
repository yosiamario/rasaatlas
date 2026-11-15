import { Router } from 'express'
import { db } from '../db.js'
import { mapTempat } from '../mappers.js'

const router = Router()

const BASE_SELECT = `
  SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon
  FROM tempat t
  JOIN kategori k ON k.id = t.kategori_id
`

const SORTS = {
  populer: 't.populer DESC, t.rating DESC',
  rating: 't.rating DESC, t.nama ASC',
  rating_asc: 't.rating ASC, t.nama ASC',
  harga: 't.harga ASC, t.nama ASC',
  harga_desc: 't.harga DESC, t.nama ASC',
  nama: 't.nama ASC',
  terbaru: 't.id DESC',
}

/**
 * GET /tempat
 * Filter: ?q=, ?kategori=<slug|id>, ?populer=1, ?min_rating=, ?max_harga=
 * Urut:   ?sort=populer|rating|harga|harga_desc|nama|terbaru
 * Halaman: ?limit=24&offset=0
 */
router.get('/', (req, res) => {
  const where = []
  const params = {}

  const q = String(req.query.q || '').trim()
  if (q) {
    where.push('(t.nama LIKE @q OR t.alamat LIKE @q OR t.deskripsi LIKE @q)')
    params.q = `%${q}%`
  }

  const kategori = String(req.query.kategori || '').trim()
  if (kategori) {
    if (/^\d+$/.test(kategori)) {
      where.push('t.kategori_id = @kategori_id')
      params.kategori_id = Number(kategori)
    } else {
      where.push('k.slug = @kategori_slug')
      params.kategori_slug = kategori
    }
  }

  if (req.query.populer === '1' || req.query.populer === 'true') {
    where.push('t.populer = 1')
  }

  const minRating = Number(req.query.min_rating)
  if (Number.isFinite(minRating) && minRating > 0) {
    where.push('t.rating >= @min_rating')
    params.min_rating = minRating
  }

  const maxHarga = Number(req.query.max_harga)
  if (Number.isFinite(maxHarga) && maxHarga > 0) {
    where.push('t.harga <= @max_harga')
    params.max_harga = maxHarga
  }

  const sortKey = String(req.query.sort || 'populer')
  const orderBy = SORTS[sortKey] || SORTS.populer

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM tempat t JOIN kategori k ON k.id = t.kategori_id ${whereSql}`)
    .get(params).n

  const rows = db
    .prepare(`${BASE_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset })

  res.json({
    data: rows.map(mapTempat),
    meta: { total, limit, offset, sort: sortKey, q, kategori },
  })
})

/** GET /tempat/:id — id angka atau slug. */
router.get('/:id', (req, res) => {
  const key = String(req.params.id)
  const row = /^\d+$/.test(key)
    ? db.prepare(`${BASE_SELECT} WHERE t.id = ?`).get(Number(key))
    : db.prepare(`${BASE_SELECT} WHERE t.slug = ?`).get(key)

  if (!row) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const terkait = db
    .prepare(
      `${BASE_SELECT} WHERE t.kategori_id = ? AND t.id <> ? ORDER BY t.rating DESC, t.nama ASC LIMIT 3`,
    )
    .all(row.kategori_id, row.id)

  res.json({ data: mapTempat(row), terkait: terkait.map(mapTempat) })
})

export default router
