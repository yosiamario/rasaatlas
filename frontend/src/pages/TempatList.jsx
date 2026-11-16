import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  Clock,
  Filter,
  LayoutGrid,
  LocateFixed,
  Map,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Star,
  Wallet,
} from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { hitungJarakKm } from '../lib/format'
import { cekStatusBuka } from '../lib/jamBuka'
import TempatCard from '../components/TempatCard'
import SearchField from '../components/SearchField'
import LeafletMap from '../components/LeafletMap'
import { EmptyState, ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

const SORTS = [
  { value: 'populer', label: 'Paling populer' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'terdekat', label: 'Lokasi terdekat' },
  { value: 'harga', label: 'Harga termurah' },
  { value: 'harga_desc', label: 'Harga tertinggi' },
  { value: 'nama', label: 'Nama A–Z' },
]

const RATING_OPTIONS = [
  { value: '', label: 'Semua rating' },
  { value: '4.5', label: '★ 4.5 ke atas' },
  { value: '4.0', label: '★ 4.0 ke atas' },
  { value: '3.5', label: '★ 3.5 ke atas' },
]

const HARGA_OPTIONS = [
  { value: '', label: 'Semua harga' },
  { value: '25000', label: '≤ Rp 25.000' },
  { value: '50000', label: '≤ Rp 50.000' },
  { value: '100000', label: '≤ Rp 100.000' },
]

const PAGE_SIZE = 12

export default function TempatList() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const kategori = params.get('kategori') || ''
  const sort = params.get('sort') || 'populer'
  const minRating = params.get('min_rating') || ''
  const maxHarga = params.get('max_harga') || ''
  const bukaSekarang = params.get('buka_sekarang') === '1'

  const [input, setInput] = useState(q)
  const debounced = useDebouncedValue(input, 350)

  // Mode tampilan: Grid atau Peta
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'

  // Lokasi pengguna untuk fitur terdekat
  const [userLocation, setUserLocation] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  // State pagination / infinite scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filter drawer/panel mobile toggle
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  useEffect(() => {
    setInput(q)
  }, [q])

  useEffect(() => {
    if (debounced === q) return
    const next = new URLSearchParams(params)
    if (debounced.trim()) next.set('q', debounced.trim())
    else next.delete('q')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [q, kategori, sort, minRating, maxHarga, bukaSekarang])

  const { data, loading, error, reload } = useApi(
    () =>
      api.tempat({
        q,
        kategori,
        sort: sort === 'terdekat' ? 'populer' : sort,
        min_rating: minRating,
        max_harga: maxHarga,
        limit: 100, // Ambil dataset lengkap untuk filtering buka/terdekat di klien
      }),
    [q, kategori, sort === 'terdekat' ? 'populer' : sort, minRating, maxHarga],
  )

  const { data: kategoriData } = useApi(() => api.kategori(), [])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value !== undefined && value !== null && value !== '') {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const resetAll = () => {
    setInput('')
    setParams({}, { replace: true })
  }

  // Deteksi lokasi pengguna untuk fitur Lokasi Terdekat
  const dapatkanLokasi = () => {
    if (!navigator.geolocation) {
      setGeoError('Perangkat tidak mendukung deteksi lokasi.')
      return
    }
    setGeoError('')
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setGeoLoading(false)
        updateParam('sort', 'terdekat')
      },
      () => {
        setGeoError('Izin lokasi ditolak atau sinyal GPS tidak ditemukan.')
        setGeoLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  // Proses data: hitung jarak, saring buka sekarang, dan urutkan
  const tempatTersaring = useMemo(() => {
    let list = (data?.data || []).map((t) => {
      let distance = null
      if (userLocation && t.lat && t.lng) {
        distance = hitungJarakKm(userLocation.lat, userLocation.lng, t.lat, t.lng)
      }
      return { ...t, distance }
    })

    // Filter buka sekarang
    if (bukaSekarang) {
      list = list.filter((t) => cekStatusBuka(t.jam_buka).isOpen)
    }

    // Urutkan terdekat bila diminta
    if (sort === 'terdekat' && userLocation) {
      list.sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    }

    return list
  }, [data?.data, bukaSekarang, sort, userLocation])

  const total = tempatTersaring.length
  const displayedItems = tempatTersaring.slice(0, visibleCount)
  const hasMore = visibleCount < total

  const muatLebihBanyak = () => {
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE)
      setLoadingMore(false)
    }, 200)
  }

  const hasActiveFilters = Boolean(minRating || maxHarga || bukaSekarang)

  return (
    <div className="page">
      <div className="container">
        <div className="list-head">
          <div>
            <span className="eyebrow">Katalog Lengkap</span>
            <h1
              className="display"
              style={{ fontSize: 'clamp(34px, 5vw, 52px)', margin: '10px 0 6px' }}
            >
              Semua tempat
            </h1>
            <p className="lede" style={{ maxWidth: '62ch' }}>
              Jelajahi tempat makan pilihan di Semarang. Gunakan filter rating, harga, status buka,
              atau lihat posisinya langsung di peta.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {user && (
              <Link className="btn btn-accent" to="/tempat/tambah">
                <Plus aria-hidden="true" /> Tambah tempat
              </Link>
            )}

            {/* Tombol Toggle Tampilan Grid / Peta */}
            <div className="view-toggle-group" role="group" aria-label="Pilih tampilan">
              <button
                type="button"
                className={`btn-view-toggle${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid aria-hidden="true" /> Grid
              </button>
              <button
                type="button"
                className={`btn-view-toggle${viewMode === 'map' ? ' active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Tampilan Peta Interaktif"
              >
                <Map aria-hidden="true" /> Peta
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar" style={{ marginTop: 24 }}>
          <SearchField value={input} onChange={setInput} onSubmit={() => {}} />

          <div className="filter-row">
            {/* Kategori Chips */}
            <div className="chip-row" aria-label="Filter kategori">
              <button
                type="button"
                className={`chip${!kategori ? ' active' : ''}`}
                onClick={() => updateParam('kategori', '')}
              >
                Semua
              </button>
              {(kategoriData?.data || []).map((k) => (
                <button
                  type="button"
                  key={k.id}
                  className={`chip${kategori === k.slug ? ' active' : ''}`}
                  onClick={() => updateParam('kategori', kategori === k.slug ? '' : k.slug)}
                >
                  <span aria-hidden="true">{k.ikon}</span>
                  {k.nama}
                </button>
              ))}
            </div>

            <div className="filter-controls-right">
              {/* Filter Rating */}
              <div className="select-wrap">
                <Star
                  aria-hidden="true"
                  style={{ position: 'absolute', left: 11, width: 14, height: 14, color: 'var(--gold)' }}
                />
                <select
                  value={minRating}
                  onChange={(e) => updateParam('min_rating', e.target.value)}
                  aria-label="Filter rating minimal"
                  style={{ paddingLeft: 30 }}
                >
                  {RATING_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>

              {/* Filter Harga */}
              <div className="select-wrap">
                <Wallet
                  aria-hidden="true"
                  style={{ position: 'absolute', left: 11, width: 14, height: 14, color: 'var(--terracotta)' }}
                />
                <select
                  value={maxHarga}
                  onChange={(e) => updateParam('max_harga', e.target.value)}
                  aria-label="Filter harga maksimal"
                  style={{ paddingLeft: 30 }}
                >
                  {HARGA_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>

              {/* Urutkan */}
              <div className="select-wrap">
                <SlidersHorizontal
                  aria-hidden="true"
                  style={{ position: 'absolute', left: 11, width: 14, height: 14, color: 'var(--muted)' }}
                />
                <select
                  value={sort}
                  onChange={(e) => {
                    if (e.target.value === 'terdekat' && !userLocation) {
                      dapatkanLokasi()
                    } else {
                      updateParam('sort', e.target.value)
                    }
                  }}
                  aria-label="Urutkan tempat"
                  style={{ paddingLeft: 30 }}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Sub-bar: Tombol Toggle Buka Sekarang & Lokasi Saya */}
          <div className="filter-sub-row">
            <button
              type="button"
              className={`chip chip-toggle${bukaSekarang ? ' active' : ''}`}
              onClick={() => updateParam('buka_sekarang', bukaSekarang ? '' : '1')}
            >
              <Clock aria-hidden="true" />
              <span>Buka Sekarang</span>
            </button>

            <button
              type="button"
              className={`chip chip-toggle${userLocation ? ' active' : ''}`}
              onClick={dapatkanLokasi}
              disabled={geoLoading}
            >
              <LocateFixed aria-hidden="true" />
              <span>{geoLoading ? 'Mencari lokasi…' : userLocation ? 'Lokasi Aktif' : 'Cari Terdekat'}</span>
            </button>

            {hasActiveFilters && (
              <button type="button" className="btn-link-reset" onClick={resetAll}>
                <RotateCcw aria-hidden="true" /> Reset semua filter
              </button>
            )}
          </div>
        </div>

        {geoError && (
          <p className="form-error" style={{ marginBottom: 16 }} role="alert">
            {geoError}
          </p>
        )}

        <div className="result-count" style={{ marginBottom: 16 }} aria-live="polite">
          {loading ? (
            'Memuat tempat…'
          ) : (
            <>
              Menampilkan <strong>{displayedItems.length}</strong> dari <strong>{total}</strong> tempat
              {kategori ? ` di kategori ${kategoriData?.data?.find((k) => k.slug === kategori)?.nama || kategori}` : ''}
              {minRating ? ` (rating ≥ ${minRating})` : ''}
              {maxHarga ? ` (harga ≤ Rp ${maxHarga})` : ''}
              {bukaSekarang ? ' (buka sekarang)' : ''}
              {q ? ` untuk “${q}”` : ''}
            </>
          )}
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : total === 0 ? (
          <EmptyState
            title="Tidak ada tempat yang cocok"
            description="Coba ubah kriteria pencarian, rating, batas harga, atau hapus filter buka sekarang."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={resetAll}>
                Reset filter pencarian
              </button>
            }
          />
        ) : viewMode === 'map' ? (
          <div className="catalog-map-wrap">
            <LeafletMap places={tempatTersaring} height={540} scrollWheel={true} />
            <p className="catalog-map-hint">
              Klik salah satu penanda di peta untuk melihat foto, rating, dan rute ke tempat tersebut.
            </p>
          </div>
        ) : (
          <>
            <div className="place-grid">
              {displayedItems.map((tempat, i) => (
                <TempatCard
                  key={tempat.id}
                  tempat={tempat}
                  priority={i < 4}
                  distance={tempat.distance}
                />
              ))}
            </div>

            {/* Tombol Pagination / Infinite Scroll */}
            {hasMore && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="btn btn-soft load-more-btn"
                  onClick={muatLebihBanyak}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Memuat tempat…' : `Muat Lebih Banyak (${total - displayedItems.length} lagi)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
