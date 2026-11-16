import { Link, NavLink } from 'react-router-dom'
import { Compass, LogIn, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { inisial } from '../lib/format'

export default function Header() {
  const { user, ready } = useAuth()

  return (
    <header className="site-header">
      <div className="container">
        <Link className="brand" to="/">
          <img src="/icons/logo.svg" alt="" width="40" height="40" />
          <span className="brand-text">
            <span className="brand-name">RasaAtlas</span>
            <span className="brand-sub">Kuliner Semarang</span>
          </span>
        </Link>

        <div className="header-actions">
          <Link className="header-link" to="/tempat">
            <Compass aria-hidden="true" />
            <span>Jelajahi</span>
          </Link>

          {user && (
            <Link className="header-link" to="/tempat/tambah" title="Tambah tempat">
              <PlusCircle aria-hidden="true" />
              <span>Tambah</span>
            </Link>
          )}

          {!ready ? (
            <span className="header-user" aria-hidden="true">
              <span className="avatar">…</span>
            </span>
          ) : user ? (
            <Link className="header-user" to="/profil" aria-label={`Profil ${user.nama}`}>
              <span className="avatar">{inisial(user.nama)}</span>
              <span className="user-name">{user.nama.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link className="header-link" to="/masuk">
              <LogIn aria-hidden="true" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
