import { Link } from 'react-router-dom'
import {
  Compass,
  Globe,
  Heart,
  LogIn,
  Moon,
  PlusCircle,
  ShieldCheck,
  Sun,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from '../context/I18nContext'
import { inisial } from '../lib/format'
import { fotoUrl } from '../lib/api'

export default function Header() {
  const { user, ready } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { lang, toggleLang, t } = useTranslation()

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
            <span>{t('nav_tempat', 'Jelajahi')}</span>
          </Link>

          <Link className="header-link" to="/favorit" title={t('nav_favorit', 'Favorit')}>
            <Heart aria-hidden="true" />
            <span className="desktop-only">{t('nav_favorit', 'Favorit')}</span>
          </Link>

          {user && (
            <Link className="header-link" to="/tempat/tambah" title={t('nav_tambah', 'Tambah')}>
              <PlusCircle aria-hidden="true" />
              <span className="desktop-only">{t('nav_tambah', 'Tambah')}</span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link className="header-link admin-pill" to="/admin/moderasi" title="Moderasi Admin">
              <ShieldCheck aria-hidden="true" />
              <span className="desktop-only">Moderasi</span>
            </Link>
          )}

          {/* Toggle Bahasa */}
          <button
            type="button"
            className="icon-btn-ghost"
            onClick={toggleLang}
            title={lang === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian'}
            aria-label="Ganti bahasa"
          >
            <Globe aria-hidden="true" />
            <span className="lang-label">{lang.toUpperCase()}</span>
          </button>

          {/* Toggle Dark Mode */}
          <button
            type="button"
            className="icon-btn-ghost"
            onClick={toggleTheme}
            title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label="Toggle tema gelap"
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>

          {!ready ? (
            <span className="header-user" aria-hidden="true">
              <span className="avatar">…</span>
            </span>
          ) : user ? (
            <Link className="header-user" to="/profil" aria-label={`Profil ${user.nama}`}>
              {user.avatar_url ? (
                <img
                  src={fotoUrl(user.avatar_url)}
                  alt=""
                  className="avatar img-avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span className="avatar">{inisial(user.nama)}</span>
              )}
              <span className="user-name">{user.nama.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link className="header-link" to="/masuk">
              <LogIn aria-hidden="true" />
              <span>{t('nav_masuk', 'Masuk')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
