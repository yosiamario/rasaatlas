import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Share2,
  Star,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { formatRupiah, formatRating } from '../lib/format'
import { ErrorState } from '../components/States'
import { SkeletonDetail } from '../components/Skeletons'
import LeafletMap from '../components/LeafletMap'

export default function TempatDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const baru = searchParams.get('baru') === '1'
  const { data, loading, error, reload } = useApi(() => api.tempatDetail(id), [id])
  const tempat = data?.data
  const terkait = data?.terkait || []

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

  const gmaps =
    tempat.lat && tempat.lng
      ? `https://www.google.com/maps/search/?api=1&query=${tempat.lat},${tempat.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${tempat.nama}, Semarang`,
        )}`

  return (
    <div className="page">
      <div className="container">
        <button type="button" className="back-link" onClick={kembali}>
          <ArrowLeft aria-hidden="true" /> Kembali
        </button>

        {baru && (
          <div className="success-banner" role="status">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>Tempat berhasil ditambahkan!</strong>
              <span>Terima kasih sudah memperkaya atlas kuliner Semarang.</span>
            </div>
            <Link className="btn btn-soft btn-sm" to="/tempat/tambah">
              Tambah lagi
            </Link>
          </div>
        )}

        <div className="detail-hero">
          <img src={fotoUrl(tempat.foto_url)} alt={`Ilustrasi hidangan di ${tempat.nama}`} />
          <div className="detail-hero-content">
            <div className="detail-hero-meta">
              <span className="badge">
                {tempat.kategori_ikon} {tempat.kategori}
              </span>
              {tempat.rating > 0 ? (
                <span className="rating-inline">
                  <Star aria-hidden="true" />
                  {formatRating(tempat.rating)} / 5
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
                <span>Jam buka</span>
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

            <p className="muted" style={{ fontSize: 11.5 }}>
              {tempat.sumber === 'pengguna'
                ? `Tempat ini dikirim oleh ${tempat.kontributor}. Rating akan tersedia setelah dikurasi pengelola.`
                : 'Foto adalah ilustrasi hidangan, bukan foto lokasi. Rating dan harga adalah data kurasi untuk keperluan pembelajaran.'}
            </p>
          </div>

          <aside>
            <div className="sidebar-card">
              <h3>Akhir pekan di sini?</h3>
              <p className="muted">Simpan halaman ini atau bagikan ke teman makanmu.</p>

              <div className="detail-actions">
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
