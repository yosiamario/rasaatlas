import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, UserRound, UtensilsCrossed } from 'lucide-react'

const items = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/tempat', label: 'Tempat', icon: UtensilsCrossed },
  { to: '/kategori', label: 'Kategori', icon: LayoutGrid },
  { to: '/profil', label: 'Profil', icon: UserRound },
]

export default function BottomNav() {
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
