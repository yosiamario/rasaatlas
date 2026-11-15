import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>RasaAtlas</strong>
          <p>
            Katalog kuliner Semarang. Data awal dari OpenStreetMap, dilengkapi manual untuk
            keperluan pembelajaran.
          </p>
        </div>
        <div className="footer-links">
          <Link to="/kategori">Kategori</Link>
          <Link to="/profil">Profil</Link>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap
          </a>
        </div>
      </div>
    </footer>
  )
}
