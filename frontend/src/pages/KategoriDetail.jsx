import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import TempatCard from '../components/TempatCard'
import { EmptyState, ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

export default function KategoriDetail() {
  const { slug } = useParams()
  const { data, loading, error, reload } = useApi(() => api.kategoriDetail(slug), [slug])
  const kategori = data?.kategori
  const daftar = data?.data || []

  useEffect(() => {
    if (!kategori) return undefined
    const prev = document.title
    document.title = `${kategori.nama} — RasaAtlas`
    return () => {
      document.title = prev
    }
  }, [kategori])

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to="/kategori">
          <ArrowLeft aria-hidden="true" /> Semua kategori
        </Link>

        {loading ? (
          <>
            <div className="skeleton" style={{ height: 120, marginBottom: 24 }} />
            <SkeletonGrid count={6} />
          </>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <>
            <div className="kategori-hero" data-slug={kategori.slug}>
              <span className="kategori-icon" aria-hidden="true">
                {kategori.ikon}
              </span>
              <div>
                <h1 className="display">{kategori.nama}</h1>
                <p>{kategori.deskripsi || 'Kumpulan tempat pilihan di kategori ini.'}</p>
              </div>
              <span className="badge green" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
                {kategori.jumlah_tempat} tempat
              </span>
            </div>

            <div className="section" style={{ marginTop: 26 }}>
              {daftar.length === 0 ? (
                <EmptyState
                  title="Kategori ini masih kosong"
                  description="Belum ada tempat yang ditambahkan ke kategori ini."
                  action={
                    <Link className="btn btn-primary btn-sm" to="/tempat">
                      Lihat semua tempat
                    </Link>
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

            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <Link className="link-arrow" to="/kategori">
                <ArrowLeft aria-hidden="true" /> Kategori lain
              </Link>
              <Link className="link-arrow" to="/tempat">
                Semua tempat <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
