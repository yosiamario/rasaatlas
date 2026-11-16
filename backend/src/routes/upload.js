import { Router } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireAuth } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.join(__dirname, '../../public/uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const router = Router()

const MIME_EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

/**
 * POST /upload — simpan gambar (base64 data URI atau buffer)
 * Mengembalikan path URL `/uploads/...`
 */
router.post('/', requireAuth, (req, res) => {
  const data = req.body?.data || req.body?.image || req.body?.foto
  if (!data || typeof data !== 'string') {
    return res.status(400).json({
      error: { message: 'Data gambar base64 wajib dikirim.', code: 'VALIDATION' },
    })
  }

  const match = data.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/)
  let mimeType = 'image/jpeg'
  let base64Data = data

  if (match) {
    mimeType = match[1].toLowerCase()
    base64Data = match[2]
  }

  const ext = MIME_EXT_MAP[mimeType] || '.jpg'
  const buffer = Buffer.from(base64Data, 'base64')

  // Batas 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({
      error: { message: 'Ukuran foto maksimal 5 MB.', code: 'FILE_TOO_LARGE' },
    })
  }

  const hash = crypto.randomBytes(16).toString('hex')
  const fileName = `${Date.now()}-${hash}${ext}`
  const filePath = path.join(UPLOADS_DIR, fileName)

  try {
    fs.writeFileSync(filePath, buffer)
    return res.status(201).json({
      url: `/uploads/${fileName}`,
      size: buffer.length,
      mime: mimeType,
    })
  } catch (err) {
    console.error('[upload] gagal menulis file:', err)
    return res.status(500).json({
      error: { message: 'Gagal menyimpan file di server.', code: 'UPLOAD_FAILED' },
    })
  }
})

export default router

