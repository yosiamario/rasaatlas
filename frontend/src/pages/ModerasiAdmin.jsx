import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { formatHargaSingkat, formatRating, tanggalPanjang } from '../lib/format'
import { EmptyState, ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

const STATUS_TABS = [
  { key: 'pending', label: 'Menunggu Moderasi' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all', label: 'Semua Status' },
]

export default function ModerasiAdmin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')
  const [actingId, setActingId] = useState(null)

  const { data, loading, error, reload } = useApi(
    () => api.tempatModerasi({ status: tab }),
    [tab],
  )
  const daftar = data?.data || []

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="state-block error">
            <div className="state-icon">
              <ShieldAlert aria-hidden="true" />
            </div>
            <h2>Akses Dibatasi</h2>
            <p>Halaman ini khusus untuk administrator RasaAtlas.</p>
            <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ubahStatus = async (id, status, catatan = '') => {
    setActingId(id)
    try {
      await api.updateModerasi(id, { status, catatan_moderasi: catatan })
      reload()
    } catch (err) {
      alert(err.message || 'Gagal mengubah status moderasi.')
    } finally {
      setActingId(null)
    }
  }

  const handleTolak = (item) => {
    const alasan = window.prompt(
      `Masukkan alasan penolakan untuk "${item.nama}":`,
      item.catatan_moderasi || 'Informasi kurang lengkap atau tidak sesuai.',
    )
    if (alasan === null) return
    ubahStatus(item.id, 'rejected', alasan)
  }

  const hapusTempat = async (id, nama) => {
    if (!window.confirm(`Hapus permanen "${nama}" dari database?`)) return
    setActingId(id)
    try {
      await api.deleteTempat(id)
      reload()
    } catch (err) {
      alert(err.message || 'Gagal menghapus tempat.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to="/profil">
          <ArrowLeft aria-hidden="true" /> Kembali ke profil
        </Link>

        <div className="list-head" style={{ marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Panel Pengelola</span>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 44px)', margin: '8px 0' }}>
              Moderasi Konten
            </h1>
            <p className="lede">
              Tinjau, setujui, edit, atau tolak tempat kuliner yang dikirimkan oleh pengguna.
            </p>
          </div>
        </div>

        <div className="filter-bar" style={{ marginBottom: 22 }}>
          <div className="chip-row" role="tablist" aria-label="Status moderasi">
            {STATUS_TABS.map((t) => (
              <button
                type="button"
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`chip${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : daftar.length === 0 ? (
          <EmptyState
            title={`Tidak ada tempat dalam kategori "${STATUS_TABS.find((t) => t.key === tab)?.label}"`}
            description="Semua konten sudah dimoderasi atau belum ada kontribusi baru."
          />
        ) : (
          <div className="moderasi-list">
            {daftar.map((item) => (
              <article className="moderasi-card" key={item.id}>
                <div className="moderasi-thumb">
                  <img
                    src={fotoUrl(item.foto_url)}
                    alt={item.nama}
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.svg'
                    }}
                  />
                  <span className={`moderasi-badge ${item.status}`}>
                    {item.status === 'approved' && 'Disetujui'}
                    {item.status === 'rejected' && 'Ditolak'}
                    {item.status === 'pending' && 'Menunggu'}
                  </span>
                </div>

                <div className="moderasi-content">
                  <div className="moderasi-head">
                    <div>
                      <span className="badge-kategori-sm">
                        {item.kategori_ikon} {item.kategori}
                      </span>
                      <h2 className="moderasi-title">{item.nama}</h2>
                    </div>
                    <div className="moderasi-user-tag">
                      <span>Dikirim oleh:</span>
                      <strong>{item.kontributor || 'Pengguna'}</strong>
                      <small>{tanggalPanjang(item.dibuat_pada)}</small>
                    </div>
                  </div>

                  <p className="moderasi-addr">{item.alamat}</p>
                  <p className="moderasi-desc">{item.deskripsi}</p>

                  <div className="moderasi-meta-grid">
                    <div>
                      <span>Harga:</span>
                      <strong>{formatHargaSingkat(item.harga)}</strong>
                    </div>
                    <div>
                      <span>Jam buka:</span>
                      <strong>{item.jam_buka}</strong>
                    </div>
                    <div>
                      <span>Koordinat:</span>
                      <strong>
                        {item.lat ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Belum diisi'}
                      </strong>
                    </div>
                  </div>

                  {item.catatan_moderasi && (
                    <div className="moderasi-note-box">
                      <strong>Catatan Pengelola:</strong>
                      <p>{item.catatan_moderasi}</p>
                    </div>
                  )}

                  <div className="moderasi-actions-bar">
                    <div className="moderasi-left-actions">
                      <Link
                        to={`/tempat/${item.slug || item.id}`}
                        target="_blank"
                        className="btn btn-soft btn-sm"
                      >
                        <ExternalLink aria-hidden="true" /> Pratinjau
                      </Link>
                      <Link
                        to={`/tempat/${item.slug || item.id}/edit`}
                        className="btn btn-soft btn-sm"
                      >
                        <Edit3 aria-hidden="true" /> Edit Data
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm danger-text"
                        onClick={() => hapusTempat(item.id, item.nama)}
                        disabled={actingId === item.id}
                      >
                        <Trash2 aria-hidden="true" /> Hapus
                      </button>
                    </div>

                    <div className="moderasi-decisions">
                      {item.status !== 'approved' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => ubahStatus(item.id, 'approved')}
                          disabled={actingId === item.id}
                        >
                          <Check aria-hidden="true" /> Setujui Tempat
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button
                          type="button"
                          className="btn btn-soft btn-sm danger-text"
                          onClick={() => handleTolak(item)}
                          disabled={actingId === item.id}
                        >
                          <X aria-hidden="true" /> Tolak
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

