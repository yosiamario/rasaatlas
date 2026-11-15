import { readFileSync } from 'node:fs'

const raw = JSON.parse(readFileSync(new URL('./raw-osm.json', import.meta.url), 'utf8'))
const KEY = ['addr:street', 'addr:housenumber', 'phone', 'opening_hours', 'website', 'cuisine', 'image', 'wikipedia', 'wikidata', 'description', 'contact:instagram']
const rows = raw.elements
  .map((el) => {
    const t = el.tags
    const score = KEY.filter((k) => t[k]).length
    return {
      id: `${el.type}/${el.id}`,
      name: t.name,
      amenity: t.amenity,
      score,
      cuisine: t.cuisine,
      addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
      phone: t.phone || t['contact:phone'],
      hours: t.opening_hours,
      website: t.website || t['contact:website'],
      instagram: t['contact:instagram'],
      image: t.image,
      desc: t.description,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
    }
  })
  .sort((a, b) => b.score - a.score)

console.log(rows.slice(0, 70).map((r) => JSON.stringify(r)).join('\n'))
console.log('\nTOTAL', rows.length)
