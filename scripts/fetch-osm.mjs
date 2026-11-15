/**
 * Ambil data kuliner Semarang dari Overpass API (OpenStreetMap).
 * Output: scripts/raw-osm.json
 *
 * Bounding box Kota Semarang: south,west,north,east
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BBOX = '-7.15,110.25,-6.93,110.50'

const query = `
[out:json][timeout:90];
(
  nwr["amenity"="restaurant"]["name"](${BBOX});
  nwr["amenity"="cafe"]["name"](${BBOX});
  nwr["amenity"="fast_food"]["name"](${BBOX});
);
out center tags;
`

const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
]

let data
for (const url of ENDPOINTS) {
  try {
    console.log(`Mengambil data dari ${url} ...`)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RasaAtlas/1.0 (student project)',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(100_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data = await res.json()
    break
  } catch (err) {
    console.warn(`Gagal: ${err.message}`)
  }
}

if (!data) throw new Error('Semua endpoint Overpass gagal.')

const elements = data.elements.filter((el) => el.tags?.name)
console.log(`Total elemen: ${data.elements.length}, dengan nama: ${elements.length}`)
console.log(
  Object.entries(
    elements.reduce((acc, el) => {
      acc[el.tags.amenity] = (acc[el.tags.amenity] || 0) + 1
      return acc
    }, {}),
  ),
)

const out = join(__dirname, 'raw-osm.json')
await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), bbox: BBOX, elements }, null, 2))
console.log(`Disimpan ke ${out}`)
