import 'dotenv/config'
import app from './app.js'
import { dbPath } from './db.js'

const port = Number(process.env.PORT) || 4000

app.listen(port, () => {
  console.log(`RasaAtlas API berjalan di http://localhost:${port}`)
  console.log(`Database: ${dbPath}`)
})
