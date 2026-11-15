import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import PwaUpdatePrompt from './PwaUpdatePrompt'

export default function Layout() {
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Lompat ke konten utama
      </a>
      <Header />
      <OfflineBanner />
      <main id="main" className="main">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <PwaUpdatePrompt />
    </div>
  )
}
