import { Router } from 'express'
import { db } from '../db.js'
import { mapKategori, mapTempat } from '../mappers.js'

const router = Router()

const LIST_SQL = `
  SELECT k.*,
    (SELECT COUNT(*) FROM tempat t WHERE t.kategori_id = k.id) AS jumlah_tempat,
    (SELECT t.foto_url FROM tempat t WHERE t.kategori_id = k.id ORDER BY t.populer DESC, t.rating DESC LIMIT 1) AS foto_sampel
  FROM kategori k
  ORDER BY k.id ASC
`

/** GET /kategori */
router.get('/', (_req, res) => {
  const rows = db.prepare(LIST_SQL).all()
  res.json({ data: rows.map(mapKategori) })
})

/** GET /kategori/:id/tempat — id angka atau slug. */
router.get('/:id/tempat', (req, res) => {
  const key = String(req.params.id)
  const kategori = /^\d+$/.test(key)
    ? db.prepare('SELECT * FROM kategori WHERE id = ?').get(Number(key))
    : db.prepare('SELECT * FROM kategori WHERE slug = ?').get(key)

  if (!kategori) {
    return res.status(404).json({
      error: { message: 'Kategori tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const rows = db
    .prepare(
      `SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon
       FROM tempat t JOIN kategori k ON k.id = t.kategori_id
       WHERE t.kategori_id = ?
       ORDER BY t.populer DESC, t.rating DESC, t.nama ASC`,
    )
    .all(kategori.id)

  const count = rows.length
  res.json({
    kategori: mapKategori({ ...kategori, jumlah_tempat: count }),
    data: rows.map(mapTempat),
    meta: { total: count },
  })
})

/** GET /kategori/:id — detail satu kategori (tanpa daftar tempat). */
router.get('/:id', (req, res) => {
  const key = String(req.params.id)
  const row = /^\d+$/.test(key)
    ? db.prepare(`${LIST_SQL.replace('ORDER BY k.id ASC', 'WHERE k.id = ?')}`).get(Number(key))
    : db.prepare(`${LIST_SQL.replace('ORDER BY k.id ASC', 'WHERE k.slug = ?')}`).get(key)

  if (!row) {
    return res.status(404).json({
      error: { message: 'Kategori tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }
  res.json({ data: mapKategori(row) })
})

export default router
