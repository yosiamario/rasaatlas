import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
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
  return entry.count > 40
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
  const avatarUrl = String(req.body?.avatar_url || '').trim()

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

  // Jika akun mengandung kata admin atau demo, beri role admin secara otomatis
  const role = email.includes('admin') ? 'admin' : 'user'

  try {
    const { rows } = await query(
      `INSERT INTO users (nama, email, password_hash, nim, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nama, email, bcrypt.hashSync(password, 10), nim, role, avatarUrl],
    )
    return res.status(201).json({ token: signToken(rows[0]), user: mapUser(rows[0]) })
  } catch (error) {
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
  const avatarUrl = req.body?.avatar_url !== undefined
    ? String(req.body.avatar_url).trim()
    : (req.user.avatar_url || '')

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
    `UPDATE users SET nama = $1, nim = $2, bio = $3, avatar_url = $4
     WHERE id = $5
     RETURNING *`,
    [nama, nim, bio, avatarUrl, req.user.id],
  )
  return res.json({ user: mapUser(rows[0]) })
})

/** PUT /auth/password — ganti password saat login */
router.put('/password', requireAuth, async (req, res) => {
  const passwordLama = String(req.body?.password_lama || '')
  const passwordBaru = String(req.body?.password_baru || '')

  if (!bcrypt.compareSync(passwordLama, req.user.password_hash)) {
    return res.status(400).json({
      error: { message: 'Password saat ini tidak cocok.', code: 'INVALID_PASSWORD' },
    })
  }
  if (passwordBaru.length < 8) {
    return res.status(400).json({
      error: { message: 'Password baru minimal 8 karakter.', code: 'VALIDATION' },
    })
  }

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    bcrypt.hashSync(passwordBaru, 10),
    req.user.id,
  ])

  return res.json({ message: 'Password berhasil diperbarui.' })
})

/** POST /auth/forgot-password — minta token reset password */
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({
      error: { message: 'Format email tidak valid.', code: 'VALIDATION' },
    })
  }

  const { rows } = await query('SELECT id FROM users WHERE email = $1', [email])
  const user = rows[0]

  if (!user) {
    // Tetap kembalikan pesan sukses agar tidak bisa enumerasi email
    return res.json({
      message: 'Instruksi reset password telah dikirim ke email kamu.',
      token_simulasi: null,
    })
  }

  const token = crypto.randomBytes(24).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

  await query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [
    token,
    expires,
    user.id,
  ])

  return res.json({
    message: 'Token reset password berhasil dibuat.',
    token_simulasi: token,
  })
})

/** POST /auth/reset-password — gunakan token untuk mengubah password */
router.post('/reset-password', async (req, res) => {
  const token = String(req.body?.token || '').trim()
  const passwordBaru = String(req.body?.password_baru || '')

  if (!token) {
    return res.status(400).json({
      error: { message: 'Token reset wajib diisi.', code: 'VALIDATION' },
    })
  }
  if (passwordBaru.length < 8) {
    return res.status(400).json({
      error: { message: 'Password baru minimal 8 karakter.', code: 'VALIDATION' },
    })
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > now()',
    [token],
  )
  const user = rows[0]

  if (!user) {
    return res.status(400).json({
      error: { message: 'Token reset tidak valid atau sudah kedaluwarsa.', code: 'INVALID_TOKEN' },
    })
  }

  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
    [bcrypt.hashSync(passwordBaru, 10), user.id],
  )

  return res.json({ message: 'Password berhasil direset. Silakan masuk dengan password baru.' })
})

/** POST /auth/verify-email — simulasi verifikasi email */
router.post('/verify-email', requireAuth, async (req, res) => {
  await query('UPDATE users SET email_verified = true WHERE id = $1', [req.user.id])
  return res.json({ message: 'Email berhasil diverifikasi.', email_verified: true })
})

/** DELETE /auth/me — hapus akun sendiri */
router.delete('/me', requireAuth, async (req, res) => {
  const password = String(req.body?.password || '')
  if (!bcrypt.compareSync(password, req.user.password_hash)) {
    return res.status(400).json({
      error: { message: 'Konfirmasi password salah untuk menghapus akun.', code: 'INVALID_PASSWORD' },
    })
  }

  // Hapus akun pengguna (cascade akan menghapus favorit dan ulasan miliknya)
  await query('DELETE FROM users WHERE id = $1', [req.user.id])
  return res.json({ message: 'Akun Anda berhasil dihapus.' })
})

export default router
