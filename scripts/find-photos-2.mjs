/** Cari kandidat foto Wikimedia Commons (batch kedua, dengan jeda). */
const queries = [
  'Asem-asem daging',
  'Mie ayam',
  'Nasi ayam',
  'Ikan bakar',
  'Hamburger',
  'Fried chicken',
  'French fries',
  'Es puter',
  'Tahu petis',
  'Rendang',
  'Coffee roasting',
  'Kopi tubruk',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const q of queries) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    q + ' filetype:bitmap',
  )}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json`
  let done = false
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RasaAtlas/1.0 (https://github.com/SekarBnY; educational project)' },
      })
      const text = await res.text()
      if (!res.ok || !text.trim().startsWith('{')) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 60).replace(/\n/g, ' ')}`)
      }
      const json = JSON.parse(text)
      const pages = Object.values(json.query?.pages || {})
      console.log(`\n### ${q}`)
      for (const p of pages) console.log(`${p.title} :: ${p.imageinfo?.[0]?.thumburl}`)
      done = true
    } catch (e) {
      console.log(`\n### ${q} percobaan ${attempt} gagal: ${e.message}`)
      await sleep(5000 * attempt)
    }
  }
  await sleep(3500)
}
