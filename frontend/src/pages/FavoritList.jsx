import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Heart, UtensilsCrossed } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import TempatCard from '../components/TempatCard'
import { EmptyState, ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

export default function FavoritList() {
  const { user } = useAuth()
  const { favorites } = useFavorites()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    if (user) {
      api
        .favorit()
        .then((res) => {
          if (alive) setPlaces(res.data || [])
        })
        .catch((err) => {
          if (alive) setError(err)
        })
        .finally(() => {
          if (alive) setLoading(false)
        })
    } else {
      // Untuk pengguna guest, ambil seluruh katalog lalu filter dengan set favorites lokal
      api
        .tempat({ limit: 100 })
        .then((res) => {
          if (alive) {
            const list = (res.data || []).filter((t) => favorites.has(t.id))
            setPlaces(list)
          }
        })
        .catch((err) => {
          if (alive) setError(err)
        })
        .finally(() => {
          if (alive) setLoading(false)
        })
    }

    return () => {
      alive = false
    }
  }, [user, favorites.size])

  const daftarTersaring = places.filter((p) => favorites.has(p.id))

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to="/tempat">
          <ArrowLeft aria-hidden="true" /> Kembali ke katalog
        </Link>

        <div className="list-head" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">Daftar Keinginan</span>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 44px)', margin: '8px 0' }}>
              Tempat Favorit
            </h1>
            <p className="lede">
              Koleksi warung, kafe, dan restoran yang sudah Anda tandai untuk dikunjungi.
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : daftarTersaring.length === 0 ? (
          <EmptyState
            title="Belum ada tempat favorit"
            description="Klik ikon hati di kartu tempat makan mana pun untuk menyimpannya ke daftar ini."
            action={
              <Link className="btn btn-primary btn-sm" to="/tempat">
                <Compass aria-hidden="true" /> Jelajahi katalog sekarang
              </Link>
            }
          />
        ) : (
          <div className="place-grid">
            {daftarTersaring.map((tempat) => (
              <TempatCard key={tempat.id} tempat={tempat} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

