import { Link } from 'react-router-dom'
import { fotoUrl } from '../lib/api'

export default function KategoriCard({ kategori }) {
  return (
    <Link
      to={`/kategori/${kategori.slug}`}
      className="kategori-card"
      data-slug={kategori.slug}
    >
      <div className="kategori-cover" aria-hidden="true">
        <img src={fotoUrl(kategori.foto_sampel)} alt="" loading="lazy" />
      </div>
      <span className="kategori-count">{kategori.jumlah_tempat} tempat</span>
      <span className="kategori-icon" aria-hidden="true">
        {kategori.ikon || '🍽️'}
      </span>
      <h3>{kategori.nama}</h3>
      <p>{kategori.deskripsi || 'Kumpulan tempat pilihan.'}</p>
    </Link>
  )
}
