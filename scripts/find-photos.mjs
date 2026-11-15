/** Cari kandidat foto Wikimedia Commons untuk tiap jenis kuliner. */
const queries = [
  'Soto ayam', 'Lumpia Semarang', 'Tahu gimbal', 'Nasi goreng', 'Bakmi jawa',
  'Gudeg', 'Sate sapi', 'Kopi susu', 'Latte art', 'Croissant', 'Cheesecake',
  'Pizza', 'Steak', 'Nasi padang', 'Ikan bakar', 'Hamburger', 'Fried chicken',
  'Mie ayam', 'Es puter', 'Bubble tea', 'Rendang', 'Asem asem', 'Wedang',
]

for (const q of queries) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    q + ' filetype:bitmap',
  )}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RasaAtlas/1.0 (student project)' } })
    const json = await res.json()
    const pages = Object.values(json.query?.pages || {})
    console.log(`\n### ${q}`)
    for (const p of pages) {
      console.log(`${p.title} :: ${p.imageinfo?.[0]?.thumburl}`)
    }
  } catch (e) {
    console.log(`\n### ${q} GAGAL ${e.message}`)
  }
}
