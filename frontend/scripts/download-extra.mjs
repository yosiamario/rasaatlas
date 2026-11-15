/** Unduh dua foto yang belum ada, lalu tambahkan barisnya ke kredit. */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/images/tempat')
const creditsPath = join(__dirname, '../../docs/CREDITS-FOTO.md')
const UA = 'RasaAtlas/1.0 (student project; contact: demo@rasaatlas.id)'

const items = [
  { out: 'asem-asem', title: 'File:Sayur asem vegetable soup.jpg' },
  { out: 'seafood', title: 'File:Kepiting saus padang.jpg' },
]

const rows = []
for (const item of items) {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url|extmetadata&iiurlwidth=1400&titles=' + encodeURIComponent(item.title)
  const json = await (await fetch(api, { headers: { 'User-Agent': UA } })).json()
  const page = Object.values(json.query.pages)[0]
  const info = page.imageinfo[0]
  const buf = Buffer.from(
    await (await fetch(info.thumburl, { headers: { 'User-Agent': UA } })).arrayBuffer(),
  )
  await sharp(buf)
    .rotate()
    .resize(1200, 800, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(outDir, `${item.out}.jpg`))

  const meta = info.extmetadata || {}
  const artist = (meta.Artist?.value || 'Tidak diketahui').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const license = meta.LicenseShortName?.value || 'Lihat halaman Commons'
  const licenseUrl = meta.LicenseUrl?.value || info.descriptionurl
  rows.push(
    `| \`${item.out}.jpg\` | ${item.title.replace('File:', '')} | ${artist} | [${license}](${licenseUrl}) | [Commons](${info.descriptionurl}) |`,
  )
  console.log(`OK ${item.out}.jpg ← ${item.title} (${license})`)
}

await writeFile(creditsPath, (await readFile(creditsPath, 'utf8')).trimEnd() + '\n' + rows.join('\n') + '\n')
console.log('Kredit diperbarui.')
