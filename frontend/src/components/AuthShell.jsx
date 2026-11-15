import { Link } from 'react-router-dom'
import { Quote } from 'lucide-react'

export default function AuthShell({ image, eyebrow, headline, quote, children }) {
  return (
    <div className="container">
      <div className="auth-wrap">
        <div className="auth-grid">
          <aside className="auth-art">
            <img src={image} alt="" />
            <span className="eyebrow">{eyebrow}</span>
            <h2>{headline}</h2>
            <p>
              Masuk untuk menyimpan identitasmu di halaman profil. Akun demo juga tersedia
              kalau kamu hanya ingin melihat-lihat.
            </p>
            <div className="quote">
              <Quote aria-hidden="true" />
              {quote}
            </div>
          </aside>
          <div className="auth-panel">
            {children}
            <p className="auth-switch">
              <Link to="/">← Kembali ke beranda</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
