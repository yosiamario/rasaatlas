import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'

const SEMARANG = [-6.9667, 110.4167]

/**
 * Peta pemilih titik. Klik di peta untuk mengisi latitude/longitude.
 * Marker mengikuti nilai lat/lng dari form agar input manual tetap sinkron.
 */
export default function LocationPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const valid =
    lat !== '' &&
    lng !== '' &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      center: SEMARANG,
      zoom: 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.on('click', (event) => {
      onChangeRef.current?.({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      })
    })

    mapRef.current = map
    const timer = setTimeout(() => map.invalidateSize(), 250)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!valid) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      return
    }

    const position = [Number(lat), Number(lng)]
    if (!markerRef.current) {
      const icon = L.divIcon({
        className: 'rasaatlas-marker',
        html: '<span class="map-pin"><span></span></span>',
        iconSize: [38, 38],
        iconAnchor: [19, 36],
      })
      markerRef.current = L.marker(position, { icon, title: 'Lokasi tempat' }).addTo(map)
    } else {
      markerRef.current.setLatLng(position)
    }
    map.setView(position, Math.max(map.getZoom(), 15))
  }, [lat, lng, valid])

  return (
    <div className="map-picker">
      <div
        ref={containerRef}
        className="leaflet-map map-picker-canvas"
        aria-label="Peta pemilih lokasi. Klik untuk menandai titik tempat."
      />
      <div className="map-picker-foot">
        <span>
          <MapPin aria-hidden="true" />
          {valid
            ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
            : 'Klik peta untuk menandai lokasi (opsional)'}
        </span>
      </div>
    </div>
  )
}
