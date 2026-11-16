import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, Plus, SlidersHorizontal } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import TempatCard from '../components/TempatCard'
import SearchField from '../components/SearchField'
import { EmptyState, ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

const SORTS = [
  { value: 'populer', label: 'Paling populer' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'harga', label: 'Harga termurah' },
  { value: 'harga_desc', label: 'Harga tertinggi' },
  { value: 'nama', label: 'Nama A–Z' },
]

export default function TempatList() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const kategori = params.get('kategori') || ''
  const sort = params.get('sort') || 'populer'

  const [input, setInput] = useState(q)
  const debounced = useDebouncedValue(input, 400)

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

  const { data, loading, error, reload } = useApi(
    () => api.tempat({ q, kategori, sort, limit: 100 }),
    [q, kategori, sort],
  )
  const { data: kategoriData } = useApi(() => api.kategori(), [])
  const daftar = data?.data || []
  const total = data?.meta?.total ?? daftar.length

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const reset = () => {
    setInput('')
    setParams({}, { replace: true })
  }

  return (
    <div className="page">
      <div className="container">
        <div className="list-head">
          <div>
            <span className="eyebrow">Katalog lengkap</span>
            <h1
              className="display"
              style={{ fontSize: 'clamp(34px, 5vw, 52px)', margin: '10px 0 6px' }}
            >
              Semua tempat
            </h1>
            <p className="lede" style={{ maxWidth: '62ch' }}>
              Saring berdasarkan kategori, cari nama tempat, atau urutkan sesuai selera.
              Semua data berasal dari satu API yang sama.
            </p>
          </div>

          {user && (
            <Link className="btn btn-accent" to="/tempat/tambah">
              <Plus aria-hidden="true" /> Tambah tempat
            </Link>
          )}
        </div>

        <div className="filter-bar" style={{ marginTop: 24 }}>
          <SearchField value={input} onChange={setInput} onSubmit={() => {}} />

          <div className="filter-row">
            <div className="chip-row" aria-label="Filter kategori">
              <button
                type="button"
                className={`chip${!kategori ? ' active' : ''}`}
                onClick={() => update('kategori', '')}
              >
                Semua
              </button>
              {(kategoriData?.data || []).map((k) => (
                <button
                  type="button"
                  key={k.id}
                  className={`chip${kategori === k.slug ? ' active' : ''}`}
                  onClick={() => update('kategori', kategori === k.slug ? '' : k.slug)}
                >
                  <span aria-hidden="true">{k.ikon}</span>
                  {k.nama}
                </button>
              ))}
            </div>

            <div className="select-wrap">
              <SlidersHorizontal
                aria-hidden="true"
                style={{ position: 'absolute', left: 12, width: 14, height: 14, color: 'var(--muted)' }}
              />
              <select
                value={sort}
                onChange={(e) => update('sort', e.target.value)}
                aria-label="Urutkan tempat"
                style={{ paddingLeft: 32 }}
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

        <div className="result-count" style={{ marginBottom: 16 }} aria-live="polite">
          {loading ? (
            'Memuat tempat…'
          ) : (
            <>
              Menampilkan <strong>{total}</strong> tempat
              {kategori ? ` di kategori ${kategoriData?.data?.find((k) => k.slug === kategori)?.nama || kategori}` : ''}
              {q ? ` untuk “${q}”` : ''}
            </>
          )}
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : daftar.length === 0 ? (
          <EmptyState
            title="Tidak ada tempat yang cocok"
            description="Coba kata kunci lain, atau hapus filter kategori yang sedang aktif."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
                Reset pencarian
              </button>
            }
          />
        ) : (
          <div className="place-grid">
            {daftar.map((tempat, i) => (
              <TempatCard key={tempat.id} tempat={tempat} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
