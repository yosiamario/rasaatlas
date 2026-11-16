import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { formatHargaSingkat, formatRating, tanggalPanjang } from '../lib/format'
import { SkeletonGrid } from '../components/Skeletons'
import { EmptyState, ErrorState } from '../components/States'

export default function KontribusiSaya() {
  const { data, loading, error, reload } = useApi(() => api.tempatSaya(), [])
  const daftar = data?.data || []
  const [deletingId, setDeletingId] = useState(null)

  const hapusTempat = async (id, nama) => {
    if (!window.confirm(`Hapus "${nama}" dari daftar kontribusi Anda?`)) return
    setDeletingId(id)
    try {
      await api.deleteTempat(id)
      reload()
    } catch (err) {
      alert(err.message || 'Gagal menghapus tempat.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderStatusBadge = (status, catatan) => {
    switch (status) {
      case 'approved':
        return (
          <span className="badge green" title="Disetujui dan tampil di katalog publik">
            <CheckCircle2 aria-hidden="true" style={{ width: 13, height: 13 }} />
            Disetujui
          </span>
        )
      case 'rejected':
        return (
          <span className="badge terracotta" title={catatan ? `Alasan: ${catatan}` : 'Ditolak'}>
            <AlertTriangle aria-hidden="true" style={{ width: 13, height: 13 }} />
            Ditolak
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="badge" title="Menunggu verifikasi admin">
            <Clock aria-hidden="true" style={{ width: 13, height: 13 }} />
            Menunggu Moderasi
          </span>
        )
    }
  }

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to="/profil">
          <ArrowLeft aria-hidden="true" /> Kembali ke profil
        </Link>

        <div className="list-head" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">Rekap Kontribusi</span>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 44px)', margin: '8px 0' }}>
              Kontribusi Saya
            </h1>
            <p className="lede">
              Semua tempat makan yang pernah Anda tambahkan ke RasaAtlas beserta status moderasinya.
            </p>
          </div>

          <Link className="btn btn-accent" to="/tempat/tambah">
            <Plus aria-hidden="true" /> Tambah tempat baru
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : daftar.length === 0 ? (
          <EmptyState
            title="Belum ada kontribusi"
            description="Anda belum menambahkan tempat makan apapun. Bagikan tempat kuliner favorit Anda di Semarang!"
            action={
              <Link className="btn btn-primary btn-sm" to="/tempat/tambah">
                <Plus aria-hidden="true" /> Tambah tempat sekarang
              </Link>
            }
          />
        ) : (
          <div className="kontribusi-grid">
            {daftar.map((item) => (
              <div className="kontribusi-card" key={item.id}>
                <div className="kontribusi-thumb">
                  <img
                    src={fotoUrl(item.foto_url)}
                    alt={item.nama}
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.svg'
                    }}
                  />
                  <div className="kontribusi-status-pill">
                    {renderStatusBadge(item.status, item.catatan_moderasi)}
                  </div>
                </div>

                <div className="kontribusi-body">
                  <div className="kontribusi-meta-top">
                    <span className="badge-kategori-sm">
                      {item.kategori_ikon} {item.kategori}
                    </span>
                    <span className="kontribusi-tgl">
                      {tanggalPanjang(item.dibuat_pada) || 'Baru'}
                    </span>
                  </div>

                  <h3 className="kontribusi-nama">{item.nama}</h3>
                  <p className="kontribusi-alamat">{item.alamat}</p>

                  <div className="kontribusi-info-row">
                    <span>
                      Harga: <strong>{formatHargaSingkat(item.harga)}</strong>
                    </span>
                    <span>
                      Rating: <strong>★ {item.rating > 0 ? formatRating(item.rating) : 'Baru'}</strong>
                    </span>
                  </div>

                  {item.catatan_moderasi && (
                    <div className="moderasi-note-box">
                      <strong>Catatan Admin:</strong>
                      <p>{item.catatan_moderasi}</p>
                    </div>
                  )}

                  <div className="kontribusi-actions">
                    <Link
                      to={`/tempat/${item.slug || item.id}`}
                      className="btn btn-soft btn-sm"
                      title="Lihat halaman detail"
                    >
                      <ExternalLink aria-hidden="true" /> Lihat
                    </Link>
                    <Link
                      to={`/tempat/${item.slug || item.id}/edit`}
                      className="btn btn-soft btn-sm"
                      title="Edit informasi tempat"
                    >
                      <Edit3 aria-hidden="true" /> Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm danger-text"
                      onClick={() => hapusTempat(item.id, item.nama)}
                      disabled={deletingId === item.id}
                      title="Hapus tempat"
                    >
                      <Trash2 aria-hidden="true" />
                      {deletingId === item.id ? '…' : 'Hapus'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

