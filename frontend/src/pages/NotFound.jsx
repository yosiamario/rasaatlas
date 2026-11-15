import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="state-block" style={{ padding: '64px 24px' }}>
          <span className="state-icon" aria-hidden="true">
            <Compass />
          </span>
          <h3>Halaman tidak ditemukan</h3>
          <p>
            Alamat yang kamu buka tidak ada di atlas ini. Mungkin salah ketik, atau tempatnya
            sudah dipindahkan.
          </p>
          <div className="guest-actions">
            <Link className="btn btn-primary" to="/">
              <Home aria-hidden="true" /> Ke beranda
            </Link>
            <Link className="btn btn-ghost" to="/tempat">
              Lihat tempat
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
