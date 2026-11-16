import { Router } from 'express'
import { query } from '../db.js'
import { mapTempat } from '../mappers.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/** GET /favorit — daftar tempat favorit pengguna yang sedang login */
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT t.*, k.nama AS kategori, k.slug AS kategori_slug, k.ikon AS kategori_ikon,
       u.nama AS kontributor,
       (SELECT COUNT(*)::int FROM ulasan ul WHERE ul.tempat_id = t.id) AS total_ulasan,
       true AS is_favorit
     FROM favorit f
     JOIN tempat t ON t.id = f.tempat_id
     JOIN kategori k ON k.id = t.kategori_id
     LEFT JOIN users u ON u.id = t.dibuat_oleh
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id],
  )

  return res.json({ data: rows.map(mapTempat) })
})

/** POST /favorit/:tempatId — tambah tempat ke favorit */
router.post('/:tempatId', requireAuth, async (req, res) => {
  const tempatId = Number(req.params.tempatId)
  if (!Number.isFinite(tempatId) || tempatId <= 0) {
    return res.status(400).json({
      error: { message: 'ID tempat tidak valid.', code: 'VALIDATION' },
    })
  }

  const { rowCount } = await query('SELECT 1 FROM tempat WHERE id = $1', [tempatId])
  if (rowCount === 0) {
    return res.status(404).json({
      error: { message: 'Tempat tidak ditemukan.', code: 'NOT_FOUND' },
    })
  }

  await query(
    `INSERT INTO favorit (user_id, tempat_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, tempat_id) DO NOTHING`,
    [req.user.id, tempatId],
  )

  return res.status(201).json({ message: 'Tempat berhasil disimpan ke favorit.', is_favorit: true })
})

/** DELETE /favorit/:tempatId — hapus tempat dari favorit */
router.delete('/:tempatId', requireAuth, async (req, res) => {
  const tempatId = Number(req.params.tempatId)
  if (!Number.isFinite(tempatId) || tempatId <= 0) {
    return res.status(400).json({
      error: { message: 'ID tempat tidak valid.', code: 'VALIDATION' },
    })
  }

  await query('DELETE FROM favorit WHERE user_id = $1 AND tempat_id = $2', [req.user.id, tempatId])

  return res.json({ message: 'Tempat dihapus dari favorit.', is_favorit: false })
})

export default router

