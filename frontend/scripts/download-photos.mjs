/**
 * Unduh foto ilustrasi dari Wikimedia Commons, kompres ke 1200x800 JPEG,
 * dan tulis atribusi ke docs/CREDITS-FOTO.md.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/images/tempat')
const creditsPath = join(__dirname, '../../docs/CREDITS-FOTO.md')
await mkdir(outDir, { recursive: true })

const items = [
  { out: 'soto-ayam', title: 'File:Soto ayam.JPG' },
  { out: 'nasi-goreng', title: 'File:Nasi goreng indonesia.jpg' },
  { out: 'tahu-gimbal', title: 'File:Tahu gimbal in Semarang.jpg' },
  { out: 'lumpia', title: 'File:Loenpia Semarang.JPG' },
  { out: 'bakmi-jawa', title: 'File:Mie Jawa.jpg' },
  { out: 'asem-asem', title: 'File:Sayur asem.jpg', fallback: 'File:Sayur asem Jakarta.jpg' },
  { out: 'mie-ayam', title: 'File:Mi ayam jamur.JPG' },
  { out: 'nasi-ayam', title: 'File:Nasi bungkus ayam goreng.JPG' },
  { out: 'latte-art', title: 'File:Latte art.jpg' },
  { out: 'croissant', title: 'File:Croissants au beurre (18953292873).jpg' },
  { out: 'es-kopi-susu', title: 'File:Es kopi susu kekinian di Yogyakarta, Indonesia.jpg' },
  { out: 'kopi-susu', title: 'File:Kopi Susu Sakarek.jpg' },
  { out: 'kopi-roastery', title: 'File:A Toper coffee roasting machine.jpg' },
  { out: 'kopi-nako', title: 'File:Javanese Kopi Tubruk.jpg' },
  { out: 'ikan-bakar', title: 'File:Ikan Bakar 3.jpg' },
  { out: 'burger', title: 'File:Hamburger gn14.jpg' },
  { out: 'seafood', title: 'File:Ikan kakap merah bakar.jpg' },
  { out: 'pizza', title: 'File:Eq it-na pizza-margherita sep2005 sml.jpg' },
  { out: 'steak', title: 'File:XO Steak and French Fries.jpg' },
  { out: 'nasi-padang', title: 'File:Nasi padang.jpg' },
  { out: 'tahu-petis', title: 'File:Tahu petis in Semarang.jpg' },
  { out: 'fried-chicken', title: 'File:Fried-Chicken-Set.jpg' },
  { out: 'french-fries', title: "File:McDonald's French Fries, Canada, 2026-04-04.jpg" },
  { out: 'es-puter', title: 'File:Es dung dung.jpg', fallback: 'File:Es campur.jpg' },
]

const UA = 'RasaAtlas/1.0 (student project; contact: demo@rasaatlas.id)'

async function getInfo(titles) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url|extmetadata&iiurlwidth=1400&titles=' +
    encodeURIComponent(titles.join('|'))
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`API HTTP ${res.status}`)
  const json = await res.json()
  return json.query?.pages || {}
}

const credits = []
for (const item of items) {
  const candidates = [item.title, item.fallback].filter(Boolean)
  let picked = null
  for (const title of candidates) {
    const pages = await getInfo([title])
    const page = Object.values(pages)[0]
    if (page && page.imageinfo?.[0]) {
      picked = { title: page.title, info: page.imageinfo[0] }
      break
    }
  }
  if (!picked) {
    console.warn(`TIDAK DITEMUKAN: ${item.out} (${candidates.join(', ')})`)
    continue
  }

  const { info } = picked
  const src = info.thumburl || info.url
  const imgRes = await fetch(src, { headers: { 'User-Agent': UA } })
  if (!imgRes.ok) {
    console.warn(`GAGAL UNDUH ${picked.title}: HTTP ${imgRes.status}`)
    continue
  }
  const buf = Buffer.from(await imgRes.arrayBuffer())
  const outPath = join(outDir, `${item.out}.jpg`)
  await sharp(buf)
    .rotate()
    .resize(1200, 800, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outPath)

  const meta = info.extmetadata || {}
  const artist = (meta.Artist?.value || 'Tidak diketahui')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const license = meta.LicenseShortName?.value || 'Lihat halaman Commons'
  const licenseUrl = meta.LicenseUrl?.value || ''
  const descUrl = info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(picked.title)}`

  credits.push({
    out: item.out,
    title: picked.title,
    artist,
    license,
    licenseUrl,
    descUrl,
  })
  console.log(`OK ${item.out}.jpg ← ${picked.title} (${license})`)
  await new Promise((r) => setTimeout(r, 400))
}

const header = `# Kredit Foto

Foto di bawah ini adalah **ilustrasi hidangan** dari Wikimedia Commons, bukan foto
dari lokasi/restoran yang bersangkutan. Semua foto berlisensi bebas dan dipotong
ke rasio 3:2 (1200×800) untuk keperluan tampilan aplikasi.

| Berkas | Karya asli | Pemotret / Pembuat | Lisensi | Sumber |
| --- | --- | --- | --- | --- |
`
const rows = credits
  .map(
    (c) =>
      `| \`${c.out}.jpg\` | ${c.title.replace('File:', '')} | ${c.artist} | [${c.license}](${c.licenseUrl || c.descUrl}) | [Commons](${c.descUrl}) |`,
  )
  .join('\n')

await writeFile(creditsPath, header + rows + '\n')
console.log(`\n${credits.length}/${items.length} foto tersimpan. Kredit: ${creditsPath}`)
