/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app for serverless execution.
 */
import 'dotenv/config'
import app, { initializeDatabase } from '../backend/src/app.js'

// Inisialisasi database sekali saat cold start
let dbReady = null
function ensureDb() {
  if (!dbReady) {
    dbReady = initializeDatabase().catch((err) => {
      dbReady = null
      console.error('[vercel] Gagal inisialisasi database:', err.message)
    })
  }
  return dbReady
}

// Middleware: pastikan DB siap sebelum memproses request
app.use(async (_req, _res, next) => {
  await ensureDb()
  next()
})

export default app
