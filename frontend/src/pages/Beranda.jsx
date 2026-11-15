import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Search, Star } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import TempatCard from '../components/TempatCard'
import KategoriCard from '../components/KategoriCard'
import { ErrorState } from '../components/States'
import { SkeletonGrid } from '../components/Skeletons'

const QUICK = ['Soto', 'Kopi', 'Lumpia', 'Tahu', 'Bakmi']

export default function Beranda() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data, loading, error, reload } = useApi(
    () =>
      Promise.all([
        api.tempat({ populer: 1, limit: 8 }),
        api.tempat({ sort: 'rating', limit: 4 }),
        api.kategori(),
      ]).then(([populer, rating, kategori]) => ({
        populer: populer.data || [],
        rating: rating.data || [],
        kategori: kategori.data || [],
      })),
    [],
  )

  const totalTempat = (data?.kategori || []).reduce((n, k) => n + k.jumlah_tempat, 0)

  const submit = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/tempat?q=${encodeURIComponent(q)}` : '/tempat')
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Peta rasa Kota Semarang</span>
            <h1 className="display">
              Kuliner Semarang,
              <br />
              <em>dalam satu atlas.</em>
            </h1>
            <p className="lede">
              24 tempat pilihan — dari soto legendaris di pagi hari sampai es puter
              tengah malam. Lengkap dengan harga, jam buka, dan titik petanya.
            </p>

            <form className="hero-search" role="search" onSubmit={submit}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mau makan apa hari ini?"
                aria-label="Cari kuliner Semarang"
              />
              <button type="submit">Cari</button>
            </form>

            <div className="hero-quick">
              <span>Lagi dicari:</span>
              {QUICK.map((item) => (
                <Link className="chip" key={item} to={`/tempat?q=${item}`}>
                  {item}
                </Link>
              ))}
            </div>

            <div className="hero-stats" aria-label="Ringkasan katalog">
              <div className="hero-stat">
                <strong>{totalTempat || 24}</strong>
                <span>Tempat kurasi</span>
              </div>
              <div className="hero-stat">
                <strong>{data?.kategori.length || 4}</strong>
                <span>Kategori</span>
              </div>
              <div className="hero-stat">
                <strong>4,6</strong>
                <span>Rating rata-rata</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <figure className="hero-photo one">
              <img src="/images/tempat/soto-ayam.jpg" alt="" width="600" height="750" fetchPriority="high" />
            </figure>
            <figure className="hero-photo two">
              <img src="/images/tempat/es-kopi-susu.jpg" alt="" width="420" height="420" loading="lazy" />
            </figure>
            <div className="hero-sticker">
              <span className="pin">
                <MapPin />
              </span>
              <div>
                <strong>Kota Lama → Banyumanik</strong>
                <span>Semua titik sudah dipetakan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {error ? (
          <section className="section">
            <ErrorState error={error} onRetry={reload} />
          </section>
        ) : (
          <>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Pilihan editor</h2>
                  <p>Tempat yang paling sering direkomendasikan warga Semarang.</p>
                </div>
                <Link className="link-arrow" to="/tempat?sort=populer">
                  Lihat semua <ArrowRight aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <SkeletonGrid count={4} />
              ) : (
                <div className="place-row">
                  {(data?.populer || []).map((tempat, i) => (
                    <TempatCard key={tempat.id} tempat={tempat} priority={i < 2} />
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Jelajahi kategori</h2>
                  <p>Empat pintu masuk untuk menemukan selera yang pas.</p>
                </div>
                <Link className="link-arrow" to="/kategori">
                  Semua kategori <ArrowRight aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <div className="kategori-grid" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div className="skeleton" style={{ height: 210 }} key={i} />
                  ))}
                </div>
              ) : (
                <div className="kategori-grid">
                  {(data?.kategori || []).map((kategori) => (
                    <KategoriCard key={kategori.id} kategori={kategori} />
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Rating tertinggi</h2>
                  <p>Kalau bingung, mulai dari yang paling dicintai.</p>
                </div>
                <Link className="link-arrow" to="/tempat?sort=rating">
                  Lihat peringkat <ArrowRight aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <SkeletonGrid count={4} />
              ) : (
                <div className="place-grid">
                  {(data?.rating || []).map((tempat) => (
                    <TempatCard key={tempat.id} tempat={tempat} />
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <div className="cta-banner">
                <div>
                  <span className="eyebrow">Simpan di layar utama</span>
                  <h2>Bawa atlas rasa ini ke mana-mana.</h2>
                  <p>
                    RasaAtlas bisa dipasang seperti aplikasi biasa dan tetap terbuka saat
                    sinyal jelek. Cocok untuk hunting kuliner di kota lama.
                  </p>
                </div>
                <div className="cta-actions">
                  <Link className="btn btn-accent" to="/profil">
                    <Star aria-hidden="true" />
                    Pasang & buat akun
                  </Link>
                  <Link className="btn btn-ghost" to="/tempat">
                    Mulai jelajah
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
