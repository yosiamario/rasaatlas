import jwt from 'jsonwebtoken'
import { db } from '../db.js'
import { mapUser } from '../mappers.js'

export const JWT_SECRET =
  process.env.JWT_SECRET || 'rasaatlas-dev-secret-hanya-untuk-lokal'
export const JWT_EXPIRES_IN = '7d'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET belum diset. Set variabel ini di server produksi!')
}

const findUser = db.prepare('SELECT * FROM users WHERE id = ?')

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/** Middleware: wajib Bearer token yang valid. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({
      error: { message: 'Silakan masuk terlebih dahulu.', code: 'UNAUTHORIZED' },
    })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = findUser.get(payload.sub)
    if (!user) {
      return res.status(401).json({
        error: { message: 'Akun tidak ditemukan.', code: 'UNAUTHORIZED' },
      })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({
      error: { message: 'Sesi berakhir, silakan masuk kembali.', code: 'TOKEN_INVALID' },
    })
  }
}

export { mapUser }
