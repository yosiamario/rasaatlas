import { NavLink } from 'react-router-dom'
import { Heart, Home, LayoutGrid, UserRound, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from '../context/I18nContext'

export default function BottomNav() {
  const { t } = useTranslation()

  const items = [
    { to: '/', label: t('nav_beranda', 'Beranda'), icon: Home, end: true },
    { to: '/tempat', label: t('nav_tempat', 'Jelajahi'), icon: UtensilsCrossed },
    { to: '/favorit', label: t('nav_favorit', 'Favorit'), icon: Heart },
    { to: '/kategori', label: t('nav_kategori', 'Kategori'), icon: LayoutGrid },
    { to: '/profil', label: t('nav_profil', 'Profil'), icon: UserRound },
  ]

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon aria-hidden="true" strokeWidth={isActive ? 2.4 : 1.9} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
