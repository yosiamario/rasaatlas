import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import { fotoUrl } from '../lib/api'
import { formatHargaSingkat, formatRating } from '../lib/format'

const SEMARANG = [-6.9667, 110.4167]

/**
 * Peta Leaflet serbaguna:
 * - Mode detail: lat, lng, nama
 * - Mode katalog/koleksi: places = [...]
 */
export default function LeafletMap({
  lat,
  lng,
  nama = 'Lokasi',
  places = null,
  height = 300,
  scrollWheel = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const isMulti = Array.isArray(places)
  const validSingle =
    !isMulti &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180

  useEffect(() => {
    if (!containerRef.current) return undefined

    const initialCenter = validSingle
      ? [Number(lat), Number(lng)]
      : SEMARANG

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: validSingle ? 16 : 12,
      scrollWheelZoom: scrollWheel,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map

    if (isMulti) {
      const markers = []
      const bounds = []

      places.forEach((p) => {
        if (!p.lat || !p.lng) return
        const pos = [Number(p.lat), Number(p.lng)]
        bounds.push(pos)

        const icon = L.divIcon({
          className: 'rasaatlas-marker',
          html: `<span class="map-pin"><span></span></span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 32],
          popupAnchor: [0, -28],
        })

        const marker = L.marker(pos, { icon, title: p.nama }).addTo(map)
        const popupContent = `
          <div class="map-popup-card">
            <img src="${fotoUrl(p.foto_url)}" alt="${p.nama}" />
            <div class="map-popup-body">
              <strong>${p.nama}</strong>
              <div class="map-popup-meta">
                <span>★ ${p.rating > 0 ? formatRating(p.rating) : 'Baru'}</span>
                <span>·</span>
                <span>${formatHargaSingkat(p.harga)}</span>
              </div>
              <a href="/tempat/${p.slug || p.id}" class="map-popup-btn">Lihat Detail →</a>
            </div>
          </div>
        `
        marker.bindPopup(popupContent, { maxWidth: 220 })
        markers.push(marker)
      })

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
      }
    } else if (validSingle) {
      const icon = L.divIcon({
        className: 'rasaatlas-marker',
        html: '<span class="map-pin"><span></span></span>',
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -32],
      })

      const marker = L.marker(initialCenter, { icon, title: nama }).addTo(map)
      marker.bindPopup(`<strong>${String(nama).replace(/</g, '&lt;')}</strong>`).openPopup()
    }

    const timer = setTimeout(() => map.invalidateSize(), 250)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, nama, places, validSingle, isMulti, scrollWheel])

  if (!isMulti && !validSingle) {
    return (
      <div className="map-placeholder">
        <MapPin aria-hidden="true" />
        <strong>Koordinat belum tersedia</strong>
        <span>Lokasi ini belum memiliki titik peta.</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="leaflet-map"
      style={{ height }}
      aria-label={isMulti ? 'Peta katalog seluruh kuliner Semarang' : `Peta lokasi ${nama}`}
    />
  )
}
