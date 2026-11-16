/** Render ikon PWA dari public/icons/logo.svg memakai sharp. */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const iconDir = join(publicDir, 'icons')
const svg = await readFile(join(iconDir, 'logo.svg'))

const jobs = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png', size: 32 },
]

for (const job of jobs) {
  await sharp(svg, { density: 900 })
    .resize(job.size, job.size)
    .png({ compressionLevel: 9 })
    .toFile(join(iconDir, job.file))
  console.log(`✓ icons/${job.file}`)
}

// Maskable: tambahkan padding 20% agar aman di safe zone Android.
const inner = Math.round(512 * 0.78)
const resized = await sharp(svg, { density: 900 }).resize(inner, inner).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#143f33' },
})
  .composite([{ input: resized, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(join(iconDir, 'maskable-512.png'))
console.log('✓ icons/maskable-512.png')
