import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { mapUser } from '../mappers.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

// Pembatas percobaan sederhana (in-memory) supaya endpoint auth tidak dibruteforce.
const attempts = new Map()
function tooManyAttempts(ip) {
  const now = Date.now()
  const entry = attempts.get(ip) || { count: 0, start: now }
  if (now - entry.start > 15 * 60 * 1000) {
    attempts.set(ip, { count: 1, start: now })
    return false
  }
  entry.count += 1
  attempts.set(ip, entry)
  return entry.count > 30
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (req, res) => {
  if (tooManyAttempts(req.ip)) {
    return res.status(429).json({
      error: { message: 'Terlalu banyak percobaan. Coba lagi nanti.', code: 'RATE_LIMITED' },
    })
  }

  const nama = String(req.body?.nama || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const nim = String(req.body?.nim || '').trim()

  if (nama.length < 2 || nama.length > 60) {
    return res.status(400).json({
      error: { message: 'Nama harus 2–60 karakter.', code: 'VALIDATION' },
    })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({
      error: { message: 'Format email tidak valid.', code: 'VALIDATION' },
    })
  }
  if (password.length < 8) {
    return res.status(400).json({
      error: { message: 'Password minimal 8 karakter.', code: 'VALIDATION' },
    })
  }
  if (nim.length > 20) {
    return res.status(400).json({
      error: { message: 'NIM maksimal 20 karakter.', code: 'VALIDATION' },
    })
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows[0]) {
    return res.status(409).json({
      error: { message: 'Email sudah terdaftar. Coba masuk saja.', code: 'EMAIL_TAKEN' },
    })
  }

  try {
    const { rows } = await query(
      `INSERT INTO users (nama, email, password_hash, nim)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nama, email, bcrypt.hashSync(password, 10), nim],
    )
    return res.status(201).json({ token: signToken(rows[0]), user: mapUser(rows[0]) })
  } catch (error) {
    // Bisa terjadi bila dua permintaan mendaftar email yang sama bersamaan.
    if (error.code === '23505') {
      return res.status(409).json({
        error: { message: 'Email sudah terdaftar. Coba masuk saja.', code: 'EMAIL_TAKEN' },
      })
    }
    throw error
  }
})

router.post('/login', async (req, res) => {
  if (tooManyAttempts(req.ip)) {
    return res.status(429).json({
      error: { message: 'Terlalu banyak percobaan. Coba lagi nanti.', code: 'RATE_LIMITED' },
    })
  }

  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email])
  const user = rows[0]

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({
      error: { message: 'Email atau password salah.', code: 'INVALID_CREDENTIALS' },
    })
  }

  return res.json({ token: signToken(user), user: mapUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: mapUser(req.user) })
})

router.put('/me', requireAuth, async (req, res) => {
  const nama = String(req.body?.nama ?? req.user.nama).trim()
  const nim = String(req.body?.nim ?? req.user.nim).trim()
  const bio = String(req.body?.bio ?? req.user.bio).trim()

  if (nama.length < 2 || nama.length > 60) {
    return res.status(400).json({
      error: { message: 'Nama harus 2–60 karakter.', code: 'VALIDATION' },
    })
  }
  if (nim.length > 20) {
    return res.status(400).json({
      error: { message: 'NIM maksimal 20 karakter.', code: 'VALIDATION' },
    })
  }
  if (bio.length > 240) {
    return res.status(400).json({
      error: { message: 'Bio maksimal 240 karakter.', code: 'VALIDATION' },
    })
  }

  const { rows } = await query(
    `UPDATE users SET nama = $1, nim = $2, bio = $3
     WHERE id = $4
     RETURNING *`,
    [nama, nim, bio, req.user.id],
  )
  return res.json({ user: mapUser(rows[0]) })
})

export default router
