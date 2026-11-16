import { Router } from 'express'
import { query } from '../db.js'
import { mapKategori, mapTempat } from '../mappers.js'

const router = Router()

const LIST_SELECT = `
  SELECT k.*,
    (SELECT COUNT(*)::int FROM tempat t WHERE t.kategori_id = k.id) AS jumlah_tempat,
    (SELECT t.foto_url FROM tempat t WHERE t.kategori_id = k.id
      ORDER BY t.populer DESC, t.rating DESC LIMIT 1) AS foto_sampel
  FROM kategori k
`

/** GET /kategori */
router.get('/', async (_req, res) => {
  const { rows } = await query(`${LIST_SELECT} ORDER BY k.id ASC`)
  res.json({ data: rows.map(mapKategori) })
})

/** GET /kategori/:id/tempat — id angka atau slug. */
router.get('/:id/tempat', async (req, res) => {
  const key = String(req.params.id)
  const kategoriResult = /^\d+$/.test(key)
    ? await query('SELECT * FROM kategori WHERE id = $1', [Number(key)])
    : await query('SELECT * FROM kategori WHERE slug = $1', [key])

  const kategori = kategoriResult.rows[0]
  if (!kategori) {
    return res.status(404).json({
      error: { message: 'Kategori tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  const { rows } = await query(
    `SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon,
       u.nama AS kontributor
     FROM tempat t
     JOIN kategori k ON k.id = t.kategori_id
     LEFT JOIN users u ON u.id = t.dibuat_oleh
     WHERE t.kategori_id = $1
     ORDER BY t.populer DESC, t.rating DESC, t.nama ASC`,
    [kategori.id],
  )

  res.json({
    kategori: mapKategori({ ...kategori, jumlah_tempat: rows.length }),
    data: rows.map(mapTempat),
    meta: { total: rows.length },
  })
})

/** GET /kategori/:id — detail satu kategori (tanpa daftar tempat). */
router.get('/:id', async (req, res) => {
  const key = String(req.params.id)
  const result = /^\d+$/.test(key)
    ? await query(`${LIST_SELECT} WHERE k.id = $1`, [Number(key)])
    : await query(`${LIST_SELECT} WHERE k.slug = $1`, [key])

  const row = result.rows[0]
  if (!row) {
    return res.status(404).json({
      error: { message: 'Kategori tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }
  res.json({ data: mapKategori(row) })
})

export default router
