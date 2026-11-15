import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'

/**
 * Peta Leaflet dengan marker kustom.
 * Library dimuat bersama halaman detail (halaman di-lazy-load).
 */
export default function LeafletMap({ lat, lng, nama = 'Lokasi' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const valid =
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180

  useEffect(() => {
    if (!valid || !containerRef.current) return undefined

    const position = [Number(lat), Number(lng)]
    const map = L.map(containerRef.current, {
      center: position,
      zoom: 16,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const icon = L.divIcon({
      className: 'rasaatlas-marker',
      html: '<span class="map-pin"><span></span></span>',
      iconSize: [38, 38],
      iconAnchor: [19, 36],
      popupAnchor: [0, -32],
    })

    const marker = L.marker(position, { icon, title: nama }).addTo(map)
    marker.bindPopup(`<strong>${String(nama).replace(/</g, '&lt;')}</strong>`)
    marker.openPopup()

    mapRef.current = map
    markerRef.current = marker

    const timer = setTimeout(() => map.invalidateSize(), 250)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [lat, lng, nama, valid])

  if (!valid) {
    return (
      <div className="map-placeholder">
        <MapPin aria-hidden="true" />
        <strong>Koordinat belum tersedia</strong>
        <span>Lokasi ini belum memiliki titik peta.</span>
      </div>
    )
  }

  return <div ref={containerRef} className="leaflet-map" aria-label={`Peta lokasi ${nama}`} />
}
