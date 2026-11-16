import jwt from 'jsonwebtoken'
import { query } from '../db.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'rasaatlas-dev-secret-hanya-untuk-lokal'
export const JWT_EXPIRES_IN = '7d'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET belum diset. Set variabel ini di server produksi!')
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/** Middleware: opsional Bearer token. */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub])
    req.user = rows[0] || null
  } catch {
    req.user = null
  }
  return next()
}

/** Middleware: wajib Bearer token yang valid. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({
      error: { message: 'Silakan masuk terlebih dahulu.', code: 'UNAUTHORIZED' },
    })
  }

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    return res.status(401).json({
      error: { message: 'Sesi berakhir, silakan masuk kembali.', code: 'TOKEN_INVALID' },
    })
  }

  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub])
    if (!rows[0]) {
      return res.status(401).json({
        error: { message: 'Akun tidak ditemukan.', code: 'UNAUTHORIZED' },
      })
    }
    req.user = rows[0]
    return next()
  } catch (error) {
    return next(error)
  }
}

/** Middleware: hanya untuk admin. */
export async function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: { message: 'Akses khusus administrator.', code: 'FORBIDDEN' },
    })
  }
  return next()
}
