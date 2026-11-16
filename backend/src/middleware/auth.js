import jwt from 'jsonwebtoken'
import { query } from '../db.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'rasaatlas-dev-secret-hanya-untuk-lokal'
export const JWT_EXPIRES_IN = '7d'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET belum diset. Set variabel ini di server produksi!')
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
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
