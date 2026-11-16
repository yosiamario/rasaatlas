import { Link } from 'react-router-dom'
import { Clock, Heart, MapPin, Navigation, Star } from 'lucide-react'
import { fotoUrl } from '../lib/api'
import { formatHargaSingkat, formatRating } from '../lib/format'
import { cekStatusBuka } from '../lib/jamBuka'
import { useFavorites } from '../context/FavoritesContext'

export default function TempatCard({ tempat, priority = false, distance = null }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorit = isFavorite(tempat.id)
  const statusBuka = cekStatusBuka(tempat.jam_buka)

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(tempat)
  }

  return (
    <Link
      to={`/tempat/${tempat.slug || tempat.id}`}
      className="place-card"
    >
      <div className="place-media">
        <img
          src={fotoUrl(tempat.foto_url)}
          alt={`Ilustrasi hidangan di ${tempat.nama}`}
          loading={priority ? 'eager' : 'lazy'}
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.svg'
          }}
        />

        <span className="place-tag">
          <span aria-hidden="true">{tempat.kategori_ikon || '🍽️'}</span>
          {tempat.kategori || 'Tidak diketahui'}
        </span>

        {/* Tombol Favorit / Bookmark */}
        <button
          type="button"
          className={`card-fav-btn${favorit ? ' active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorit ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          title={favorit ? 'Tersimpan di favorit' : 'Tambah ke favorit'}
        >
          <Heart aria-hidden="true" />
        </button>

        {/* Rating Pill */}
        <span className={`rating-pill${tempat.rating > 0 ? '' : ' baru'}`}>
          {tempat.rating > 0 ? (
            <>
              <Star aria-hidden="true" />
              {formatRating(tempat.rating)}
            </>
          ) : (
            'Baru'
          )}
        </span>
      </div>

      <div className="place-body">
        <div className="place-body-top">
          <h3 className="place-title">{tempat.nama || 'Tidak diketahui'}</h3>

          {/* Status Buka Sekarang */}
          <span className={`status-pill ${statusBuka.statusClass}`} title={statusBuka.note}>
            <span className="status-dot" />
            {statusBuka.label}
          </span>
        </div>

        <p className="place-addr">
          <MapPin aria-hidden="true" />
          <span>{tempat.alamat || 'Tidak diketahui'}</span>
        </p>

        {distance !== null && (
          <span className="place-distance">
            <Navigation aria-hidden="true" />
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} dari lokasi Anda
          </span>
        )}

        <div className="place-foot">
          <span className="price">
            {formatHargaSingkat(tempat.harga)}
            <small>per orang</small>
          </span>
          <span className="hours">
            <Clock aria-hidden="true" />
            {tempat.jam_buka || 'Tidak diketahui'}
          </span>
        </div>
      </div>
    </Link>
  )
}
