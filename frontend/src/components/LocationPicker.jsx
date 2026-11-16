import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, MapPin, Navigation, RotateCcw } from 'lucide-react'

const SEMARANG = [-6.9667, 110.4167]

const PRESET_SEMARANG = [
  { nama: 'Simpang Lima', lat: -6.9902, lng: 110.4229 },
  { nama: 'Kota Lama', lat: -6.9682, lng: 110.4285 },
  { nama: 'Tugu Muda', lat: -6.9842, lng: 110.4093 },
  { nama: 'Tembalang / Undip', lat: -7.0515, lng: 110.4372 },
  { nama: 'Pleburan', lat: -6.9938, lng: 110.4217 },
]

export default function LocationPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  const valid =
    lat !== '' &&
    lng !== '' &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180

  useEffect(() => {
    if (!containerRef.current) return undefined

    const initialCenter = valid ? [Number(lat), Number(lng)] : SEMARANG
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: valid ? 15 : 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Klik di peta untuk menaruh atau memindahkan pin
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

      // Jadikan marker bisa digeser (draggable) agar sangat mudah diatur
      const marker = L.marker(position, {
        icon,
        draggable: true,
        title: 'Tarik titik ini untuk menyesuaikan lokasi',
      }).addTo(map)

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng()
        onChangeRef.current?.({
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6)),
        })
      })

      markerRef.current = marker
    } else {
      markerRef.current.setLatLng(position)
    }

    map.setView(position, Math.max(map.getZoom(), 15))
  }, [lat, lng, valid])

  const pilihPreset = (item) => {
    setGeoError('')
    onChange({ lat: String(item.lat), lng: String(item.lng) })
  }

  const deteksiLokasi = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser ini tidak mendukung deteksi lokasi.')
      return
    }
    setGeoError('')
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        })
        setGeoLoading(false)
      },
      () => {
        setGeoError('Gagal mendeteksi lokasi GPS. Klik peta atau pilih area.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const resetTitik = () => {
    onChange({ lat: '', lng: '' })
  }

  return (
    <div className="location-picker-wrap">
      <div className="picker-presets" aria-label="Preset area Semarang">
        <span className="preset-label">Area populer:</span>
        <div className="preset-chips">
          {PRESET_SEMARANG.map((item) => (
            <button
              type="button"
              key={item.nama}
              className="chip chip-sm"
              onClick={() => pilihPreset(item)}
            >
              {item.nama}
            </button>
          ))}
        </div>
      </div>

      <div className="map-picker">
        <div
          ref={containerRef}
          className="leaflet-map map-picker-canvas"
          aria-label="Peta interaktif. Klik atau geser penanda untuk memilih titik."
        />
        <div className="map-picker-foot">
          <span>
            <MapPin aria-hidden="true" />
            {valid
              ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
              : 'Klik peta atau geser penanda untuk menandai titik'}
          </span>
          <div className="picker-foot-actions">
            <button
              type="button"
              className="btn-picker-action"
              onClick={deteksiLokasi}
              disabled={geoLoading}
              title="Gunakan lokasi perangkat saat ini"
            >
              <LocateFixed aria-hidden="true" />
              {geoLoading ? 'Mencari GPS…' : 'GPS Saya'}
            </button>
            {valid && (
              <button
                type="button"
                className="btn-picker-action danger"
                onClick={resetTitik}
                title="Hapus titik"
              >
                <RotateCcw aria-hidden="true" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {geoError && <p className="form-error" role="alert">{geoError}</p>}
    </div>
  )
}
