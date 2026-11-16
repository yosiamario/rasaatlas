import express from 'express'
import cors from 'cors'
import { ensureSchema, query } from './db.js'
import { seedDatabase } from './seed.js'
import tempatRouter from './routes/tempat.js'
import kategoriRouter from './routes/kategori.js'
import authRouter from './routes/auth.js'

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
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`))
    },
  }),
)
app.use(express.json({ limit: '100kb' }))

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
    version: '1.1.0',
    database: 'Supabase PostgreSQL',
    endpoints: [
      'GET /tempat',
      'GET /tempat/:id',
      'POST /tempat (perlu login)',
      'GET /kategori',
      'GET /kategori/:id/tempat',
      'GET /kategori/:id',
      'POST /auth/register',
      'POST /auth/login',
      'GET /auth/me',
      'PUT /auth/me',
      'GET /health',
    ],
  })
})

app.get('/health', async (_req, res) => {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM tempat')
  res.json({
    status: 'ok',
    database: 'supabase',
    tempat: rows[0].n,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

app.use('/tempat', tempatRouter)
app.use('/kategori', kategoriRouter)
app.use('/auth', authRouter)

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
