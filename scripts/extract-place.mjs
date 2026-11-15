import { readFileSync } from 'node:fs'
const raw = JSON.parse(readFileSync(new URL('./raw-osm.json', import.meta.url), 'utf8'))
const wanted = [
  'Soto Bangkong',
  'Nasi Goreng Babat "Pak Karmin" Mberok',
  'Tahu Gimbal Mas Rendra',
  'Swieke & Lumpia Koh Hoo',
  'Bakmi Jawa Pak Gareng',
  'Gudeg Abimanyu',
  'Asem-Asem Koh Liem',
  'Nasi Ayam "Mbok Ru"',
  'Dijkstra Kota Lama',
  'Bloomery Patisserie Kota Lama',
  'Moment Coffee & Space',
  'Maeru Coffee & Roastery',
  'Honest Coffee & Communal Place',
  'Kedai Kopi Old Kettle',
  'Marabunta',
  'Sakapatat beer garden & resto',
  "Ellena's Kitchen",
  'Converso Coffee & Eatery',
  'The Tavern',
  'Pringsewu Kota Lama Semarang',
  'Richese Factory',
  "McDonald's Pamularsih Semarang",
  'Mie Gacoan',
  'Tahu Petis Mirasa',
  'Aneka Wedang & Es Puter Mataram "Pak Kirman"',
  'Kopi Nako',
  'Mie & Bihun Titee Mei Sin',
  'Sate Sapi Pak Kempleng',
  'Han\'s Kopi',
]
for (const w of wanted) {
  const e = raw.elements.find((x) => x.tags.name === w)
  if (!e) { console.log(`TIDAK ADA: ${w}`); continue }
  const t = e.tags
  console.log(JSON.stringify({
    name: t.name,
    amenity: t.amenity,
    id: `${e.type}/${e.id}`,
    addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
    street: t['addr:street'], hn: t['addr:housenumber'], city: t['addr:city'],
    phone: t.phone || t['contact:phone'],
    hours: t.opening_hours,
    website: t.website || t['contact:website'],
    cuisine: t.cuisine,
    lat: e.lat ?? e.center?.lat,
    lon: e.lon ?? e.center?.lon,
    all: t,
  }))
}
