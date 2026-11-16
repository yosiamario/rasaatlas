import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Share2,
  Star,
  Trash2,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { formatRupiah, formatRating } from '../lib/format'
import { cekStatusBuka } from '../lib/jamBuka'
import { ErrorState } from '../components/States'
import { SkeletonDetail } from '../components/Skeletons'
import LeafletMap from '../components/LeafletMap'
import UlasanSection from '../components/UlasanSection'

export default function TempatDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const baru = searchParams.get('baru') === '1'
  const { data, loading, error, reload } = useApi(() => api.tempatDetail(id), [id])
  const tempat = data?.data
  const terkait = data?.terkait || []

  // Ambil daftar ulasan
  const {
    data: ulasanData,
    reload: reloadUlasan,
  } = useApi(() => (tempat?.id ? api.ulasan(tempat.id) : Promise.resolve({ data: [] })), [tempat?.id])
  const ulasanList = ulasanData?.data || []

  useEffect(() => {
    if (!tempat) return undefined
    const prev = document.title
    document.title = `${tempat.nama} — RasaAtlas`
    return () => {
      document.title = prev
    }
  }, [tempat])

  const kembali = () => {
    if (window.history.length > 2) navigate(-1)
    else navigate('/tempat')
  }

  const bagikan = async () => {
    const url = window.location.href
    const payload = {
      title: `${tempat?.nama} — RasaAtlas`,
      text: tempat?.deskripsi?.slice(0, 110),
      url,
    }
    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      /* pengguna membatalkan share */
    }
  }

  const hapusTempat = async () => {
    if (!window.confirm(`Yakin ingin menghapus ${tempat.nama}? Tindakan ini permanen.`)) return
    setDeleting(true)
    try {
      await api.deleteTempat(tempat.id)
      navigate('/tempat')
    } catch (err) {
      alert(err.message || 'Gagal menghapus tempat.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="skeleton" style={{ height: 34, width: 120, marginBottom: 18 }} />
          <SkeletonDetail />
        </div>
      </div>
    )
  }

  if (error || !tempat) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 720 }}>
          <button type="button" className="back-link" onClick={kembali}>
            <ArrowLeft aria-hidden="true" /> Kembali
          </button>
          <ErrorState
            error={error || { message: 'Tempat tidak ditemukan.' }}
            title="Tempat tidak ditemukan"
            onRetry={reload}
          />
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            <Link className="link-arrow" to="/tempat">
              Lihat semua tempat <ArrowUpRight aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const statusBuka = cekStatusBuka(tempat.jam_buka)
  const isFavorit = isFavorite(tempat.id)
  const isOwner = user && user.id === tempat.dibuat_oleh
  const isAdmin = user && user.role === 'admin'
  const canManage = isOwner || isAdmin

  const gmaps =
    tempat.lat && tempat.lng
      ? `https://www.google.com/maps/search/?api=1&query=${tempat.lat},${tempat.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${tempat.nama}, Semarang`,
        )}`

  return (
    <div className="page">
      <div className="container">
        <div className="detail-top-nav">
          <button type="button" className="back-link" onClick={kembali}>
            <ArrowLeft aria-hidden="true" /> Kembali
          </button>

          {canManage && (
            <div className="manage-buttons">
              <Link to={`/tempat/${tempat.slug || tempat.id}/edit`} className="btn btn-soft btn-sm">
                <Edit3 aria-hidden="true" /> Edit Data
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm danger-text"
                onClick={hapusTempat}
                disabled={deleting}
              >
                <Trash2 aria-hidden="true" /> {deleting ? '…' : 'Hapus'}
              </button>
            </div>
          )}
        </div>

        {baru && (
          <div className="success-banner" role="status">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>Tempat berhasil ditambahkan!</strong>
              <span>Terima kasih sudah memperkaya atlas kuliner Semarang. Tempat sedang ditinjau.</span>
            </div>
            <Link className="btn btn-soft btn-sm" to="/tempat/tambah">
              Tambah lagi
            </Link>
          </div>
        )}

        {/* Banner Status Moderasi */}
        {tempat.status === 'pending' && (
          <div className="moderasi-banner pending" role="status">
            <Clock aria-hidden="true" />
            <div>
              <strong>Menunggu Moderasi</strong>
              <span>Tempat ini baru dikirim dan sedang menunggu persetujuan pengelola sebelum tampil di katalog utama.</span>
            </div>
          </div>
        )}

        {tempat.status === 'rejected' && (
          <div className="moderasi-banner rejected" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Kontribusi Ditolak</strong>
              <span>{tempat.catatan_moderasi ? `Catatan: ${tempat.catatan_moderasi}` : 'Data belum memenuhi standar kelengkapan.'}</span>
            </div>
          </div>
        )}

        <div className="detail-hero">
          <img src={fotoUrl(tempat.foto_url)} alt={`Ilustrasi hidangan di ${tempat.nama}`} />
          <div className="detail-hero-content">
            <div className="detail-hero-meta">
              <span className="badge">
                {tempat.kategori_ikon} {tempat.kategori}
              </span>

              {/* Status Buka Sekarang */}
              <span className={`status-pill ${statusBuka.statusClass}`}>
                <span className="status-dot" />
                {statusBuka.label}
              </span>

              {tempat.rating > 0 ? (
                <span className="rating-inline">
                  <Star aria-hidden="true" />
                  {formatRating(tempat.rating)} / 5 ({ulasanList.length} ulasan)
                </span>
              ) : (
                <span className="rating-inline">Baru · belum ada rating</span>
              )}
            </div>

            <h1 className="display">{tempat.nama}</h1>

            {tempat.sumber === 'pengguna' && (
              <span className="detail-contributor">
                <UserRound aria-hidden="true" />
                Ditambahkan oleh {tempat.kontributor}
              </span>
            )}
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <p className="detail-intro">{tempat.deskripsi || 'Belum ada deskripsi.'}</p>

            <div className="fact-grid">
              <div className="fact">
                <Wallet aria-hidden="true" />
                <span>Kisaran harga</span>
                <strong>{formatRupiah(tempat.harga)} / orang</strong>
              </div>
              <div className="fact">
                <Clock aria-hidden="true" />
                <span>Jam operasional</span>
                <strong>{tempat.jam_buka || 'Tidak diketahui'}</strong>
              </div>
              <div className="fact">
                <UtensilsCrossed aria-hidden="true" />
                <span>Kategori</span>
                <strong>{tempat.kategori || 'Tidak diketahui'}</strong>
              </div>
            </div>

            <div className="fact" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MapPin aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2 }} />
              <div>
                <span style={{ marginTop: 0 }}>Alamat</span>
                <strong style={{ marginTop: 2 }}>{tempat.alamat || 'Tidak diketahui'}</strong>
              </div>
            </div>

            <div className="map-card">
              <div className="map-card-head">
                <h3>
                  <Navigation aria-hidden="true" /> Titik lokasi
                </h3>
                <a href={gmaps} target="_blank" rel="noreferrer">
                  Buka di Google Maps <ExternalLink aria-hidden="true" />
                </a>
              </div>
              <LeafletMap lat={tempat.lat} lng={tempat.lng} nama={tempat.nama} />
            </div>

            {/* Bagian Ulasan Pengguna */}
            <UlasanSection
              tempatId={tempat.id}
              ulasanList={ulasanList}
              onUlasanChange={() => {
                reloadUlasan()
                reload()
              }}
            />

            <p className="muted" style={{ fontSize: 11.5 }}>
              {tempat.sumber === 'pengguna'
                ? `Tempat ini dikirim oleh ${tempat.kontributor}.`
                : 'Foto adalah ilustrasi hidangan. Rating dihitung dari kurasi dan ulasan pengguna.'}
            </p>
          </div>

          <aside>
            <div className="sidebar-card">
              <h3>Ingin ke sini?</h3>
              <p className="muted">Simpan ke favorit atau bagikan rutenya ke teman.</p>

              <div className="detail-actions">
                <button
                  type="button"
                  className={`btn ${isFavorit ? 'btn-accent' : 'btn-soft'} btn-sm`}
                  onClick={() => toggleFavorite(tempat)}
                >
                  <Heart aria-hidden="true" className={isFavorit ? 'fill-current' : ''} />
                  {isFavorit ? 'Tersimpan di Favorit' : 'Tambah ke Favorit'}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={bagikan}>
                  {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
                  {copied ? 'Tersalin' : 'Bagikan'}
                </button>
                <a className="btn btn-soft btn-sm" href={gmaps} target="_blank" rel="noreferrer">
                  <MapPin aria-hidden="true" /> Rute
                </a>
              </div>

              {terkait.length > 0 && (
                <>
                  <div className="sidebar-divider" />
                  <h3 style={{ fontSize: 17 }}>Tempat serupa</h3>
                  <p className="muted">Masih di kategori {tempat.kategori}.</p>
                  <div className="sidebar-list">
                    {terkait.map((item) => (
                      <Link className="sidebar-item" key={item.id} to={`/tempat/${item.slug}`}>
                        <img src={fotoUrl(item.foto_url)} alt="" loading="lazy" />
                        <div>
                          <strong>{item.nama}</strong>
                          <span>
                            ★ {item.rating > 0 ? formatRating(item.rating) : 'Baru'} ·{' '}
                            {formatRupiah(item.harga)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    className="link-arrow"
                    to={`/kategori/${tempat.kategori_slug}`}
                    style={{ marginTop: 12 }}
                  >
                    Lihat semua {tempat.kategori} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
