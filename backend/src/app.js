import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureSchema, query } from './db.js'
import { seedDatabase } from './seed.js'
import tempatRouter from './routes/tempat.js'
import kategoriRouter from './routes/kategori.js'
import authRouter from './routes/auth.js'
import favoritRouter from './routes/favorit.js'
import uploadRouter, { UPLOADS_DIR } from './routes/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Postman/curl tidak mengirim Origin.
      if (!origin) return callback(null, true)
      // Vercel serverless: frontend & API di domain yang sama
      if (process.env.VERCEL) return callback(null, true)
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`))
    },
  }),
)

// Dukung upload base64 hingga 10MB
app.use(express.json({ limit: '10mb' }))

// Sajikan file statis folder uploads
app.use('/uploads', express.static(UPLOADS_DIR))

app.use((req, _res, next) => {
  if (req.path !== '/health') {
    console.log(`${req.method} ${req.originalUrl}`)
  }
  next()
})

app.get('/', (_req, res) => {
  res.json({
    name: 'RasaAtlas API',
    description: 'Katalog kuliner Semarang — REST API',
    version: '2.0.0',
    database: 'Neon PostgreSQL',
    endpoints: [
      'GET /tempat',
      'GET /tempat/:id',
      'POST /tempat (perlu login)',
      'PUT /tempat/:id (pemilik/admin)',
      'DELETE /tempat/:id (pemilik/admin)',
      'GET /tempat/saya (perlu login)',
      'GET /tempat/moderasi (admin)',
      'PATCH /tempat/:id/moderasi (admin)',
      'GET /tempat/:id/ulasan',
      'POST /tempat/:id/ulasan (perlu login)',
      'GET /favorit (perlu login)',
      'POST /favorit/:id (perlu login)',
      'DELETE /favorit/:id (perlu login)',
      'POST /upload (perlu login)',
      'GET /kategori',
      'GET /kategori/:id/tempat',
      'GET /kategori/:id',
      'POST /auth/register',
      'POST /auth/login',
      'GET /auth/me',
      'PUT /auth/me',
      'PUT /auth/password',
      'POST /auth/forgot-password',
      'POST /auth/reset-password',
      'DELETE /auth/me',
      'GET /health',
    ],
  })
})

app.get('/health', async (_req, res) => {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM tempat')
  res.json({
    status: 'ok',
    database: 'neon',
    tempat: rows[0].n,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

app.use('/tempat', tempatRouter)
app.use('/kategori', kategoriRouter)
app.use('/auth', authRouter)
app.use('/favorit', favoritRouter)
app.use('/upload', uploadRouter)

app.use((req, res) => {
  res.status(404).json({
    error: { message: `Endpoint ${req.method} ${req.path} tidak ditemukan.`, code: 'NOT_FOUND' },
  })
})

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  if (err.message?.startsWith('Origin ')) {
    return res.status(403).json({
      error: { message: err.message, code: 'CORS_FORBIDDEN' },
    })
  }
  res.status(500).json({
    error: { message: 'Terjadi kesalahan di server.', code: 'INTERNAL_ERROR' },
  })
})

/** Siapkan skema lalu isi data awal bila database masih kosong. */
export async function initializeDatabase() {
  await ensureSchema()
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM tempat')
  if (rows[0].n === 0) {
    console.log('Database kosong — menjalankan seed otomatis...')
    const result = await seedDatabase()
    console.log(
      `Seed otomatis: ${result.totalTempat} tempat, ${result.totalKategori} kategori.`,
    )
  }
}

export default app
