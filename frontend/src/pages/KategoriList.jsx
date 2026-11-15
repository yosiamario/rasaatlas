import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import KategoriCard from '../components/KategoriCard'
import { ErrorState } from '../components/States'

export default function KategoriList() {
  const { data, loading, error, reload } = useApi(() => api.kategori(), [])
  const kategori = data?.data || []

  return (
    <div className="page">
      <div className="container">
        <span className="eyebrow">Empat pintu masuk</span>
        <h1 className="display" style={{ fontSize: 'clamp(34px, 5vw, 54px)', margin: '10px 0 8px' }}>
          Pilih suasana makannya.
        </h1>
        <p className="lede" style={{ maxWidth: '62ch' }}>
          Mau sarapan soto, kerja di kafe, makan malam rombongan, atau jajan sore?
          Mulai dari kategori yang paling sesuai dengan rencanamu.
        </p>

        <div className="section" style={{ marginTop: 30 }}>
          {loading ? (
            <div className="kategori-grid" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="skeleton" style={{ height: 220 }} key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <div className="kategori-grid kategori-grid-large">
              {kategori.map((item) => (
                <KategoriCard key={item.id} kategori={item} />
              ))}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="category-note">
            <div>
              <h2>Belum menemukan yang pas?</h2>
              <p>
                Coba telusuri seluruh katalog dan urutkan berdasarkan harga atau rating.
              </p>
            </div>
            <Link className="btn btn-primary" to="/tempat">
              Buka semua tempat <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}

        <p style={{ marginTop: 26 }}>
          <Link className="link-arrow" to="/">
            <ArrowLeft aria-hidden="true" /> Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
