import { Link } from 'react-router-dom'
import { Clock, MapPin, Star } from 'lucide-react'
import { fotoUrl } from '../lib/api'
import { formatHargaSingkat, formatRating } from '../lib/format'

export default function TempatCard({ tempat, priority = false }) {
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
        <h3 className="place-title">{tempat.nama || 'Tidak diketahui'}</h3>
        <p className="place-addr">
          <MapPin aria-hidden="true" />
          <span>{tempat.alamat || 'Tidak diketahui'}</span>
        </p>
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
