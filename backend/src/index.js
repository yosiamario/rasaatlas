import 'dotenv/config'
import app, { initializeDatabase } from './app.js'
import { databaseLabel } from './db.js'

const port = Number(process.env.PORT) || 4000

try {
  await initializeDatabase()
  app.listen(port, () => {
    console.log(`RasaAtlas API berjalan di http://localhost:${port}`)
    console.log(`Database: Supabase PostgreSQL (${databaseLabel()})`)
  })
} catch (error) {
  console.error('[startup] Gagal menyiapkan database:', error.message)
  process.exit(1)
}
