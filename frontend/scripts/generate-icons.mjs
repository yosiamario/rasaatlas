/** Render ikon PWA dari public/icon.svg memakai sharp. */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const svg = await readFile(join(publicDir, 'icon.svg'))

const jobs = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32x32.png', size: 32 },
]

for (const job of jobs) {
  await sharp(svg, { density: 900 })
    .resize(job.size, job.size)
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, job.file))
  console.log(`✓ ${job.file}`)
}

// Maskable: tambahkan padding 20% agar aman di safe zone Android.
const inner = Math.round(512 * 0.78)
const resized = await sharp(svg, { density: 900 }).resize(inner, inner).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#143f33' },
})
  .composite([{ input: resized, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, 'maskable-512x512.png'))
console.log('✓ maskable-512x512.png')
