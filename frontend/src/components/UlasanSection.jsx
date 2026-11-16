import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, MessageSquare, Send, Star, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatRating, inisial, tanggalPanjang } from '../lib/format'
import { queueOfflineAction } from '../lib/offlineQueue'

export default function UlasanSection({ tempatId, ulasanList = [], onUlasanChange }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [komentar, setKomentar] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  // Cari ulasan yang sudah pernah dibuat oleh user saat ini (jika ada)
  const ulasanSaya = user ? ulasanList.find((u) => u.user_id === user.id) : null

  const kirimUlasan = async (e) => {
    e.preventDefault()
    setError('')
    setFeedback('')

    if (rating < 1 || rating > 5) {
      setError('Silakan pilih rating 1–5 bintang.')
      return
    }

    setSubmitting(true)

    // Jika offline, simpan di antrean lokal
    if (!navigator.onLine) {
      queueOfflineAction({
        type: 'create_ulasan',
        id_target: tempatId,
        payload: { rating, komentar: komentar.trim() },
      })
      setFeedback('Ulasan disimpan secara offline dan akan disinkronkan saat terhubung kembali.')
      setSubmitting(false)
      return
    }

    try {
      await api.createUlasan(tempatId, { rating, komentar: komentar.trim() })
      setFeedback('Terima kasih! Ulasan kamu berhasil dikirim.')
      setKomentar('')
      onUlasanChange?.()
    } catch (err) {
      setError(err.message || 'Gagal mengirim ulasan.')
    } finally {
      setSubmitting(false)
    }
  }

  const hapusUlasan = async (ulasanId) => {
    if (!window.confirm('Hapus ulasan ini?')) return
    try {
      await api.deleteUlasan(tempatId, ulasanId)
      onUlasanChange?.()
    } catch (err) {
      alert(err.message || 'Gagal menghapus ulasan.')
    }
  }

  return (
    <section className="panel ulasan-section" aria-labelledby="ulasan-title">
      <div className="section-head" style={{ marginBottom: 14 }}>
        <div>
          <h2 id="ulasan-title" style={{ fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare aria-hidden="true" style={{ width: 20, height: 20 }} />
            Ulasan Pengguna ({ulasanList.length})
          </h2>
          <p>Bagikan kesan rasa, pelayanan, atau rekomendasi menu terbaikmu.</p>
        </div>
      </div>

      {user ? (
        <form className="ulasan-form" onSubmit={kirimUlasan}>
          <div className="ulasan-form-head">
            <span className="avatar sm" aria-hidden="true">
              {inisial(user.nama)}
            </span>
            <div className="ulasan-user-info">
              <strong>{user.nama}</strong>
              <span>{ulasanSaya ? 'Perbarui ulasanmu:' : 'Beri penilaian tempat ini:'}</span>
            </div>

            <div
              className="star-rating-picker"
              role="radiogroup"
              aria-label="Pilih bintang rating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} bintang`}
                  className={`star-btn${(hoverRating || rating) >= star ? ' active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star aria-hidden="true" />
                </button>
              ))}
              <span className="star-rating-label">{rating} / 5</span>
            </div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <textarea
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Apa yang paling berkesan dari tempat ini? Menu rekomendasi, porsi, atau suasananya..."
              maxLength={500}
              rows={3}
            />
            <span className="hint">{komentar.length}/500 karakter (opsional)</span>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {feedback && <p className="form-success" role="status">{feedback}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              <Send aria-hidden="true" /> {submitting ? 'Mengirim…' : ulasanSaya ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
            </button>
          </div>
        </form>
      ) : (
        <div className="ulasan-login-box">
          <p>Masuk untuk menulis ulasan dan memberikan rating pada tempat ini.</p>
          <Link className="btn btn-soft btn-sm" to="/masuk">
            <LogIn aria-hidden="true" /> Masuk akun
          </Link>
        </div>
      )}

      {ulasanList.length === 0 ? (
        <div className="ulasan-empty">
          <Star aria-hidden="true" />
          <p>Belum ada ulasan dari pengguna. Jadilah yang pertama memberikan ulasan!</p>
        </div>
      ) : (
        <div className="ulasan-list">
          {ulasanList.map((item) => (
            <article className="ulasan-item" key={item.id}>
              <div className="ulasan-item-head">
                <span className="avatar sm" aria-hidden="true">
                  {inisial(item.user_nama)}
                </span>
                <div>
                  <strong>{item.user_nama}</strong>
                  <div className="ulasan-meta-inline">
                    <span className="star-pills">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} aria-hidden="true" className="star-filled" />
                      ))}
                    </span>
                    <span className="bullet">·</span>
                    <time dateTime={item.dibuat_pada}>
                      {tanggalPanjang(item.dibuat_pada) || 'Baru saja'}
                    </time>
                  </div>
                </div>

                {user && (user.id === item.user_id || user.role === 'admin') && (
                  <button
                    type="button"
                    className="btn-delete-ulasan"
                    onClick={() => hapusUlasan(item.id)}
                    title="Hapus ulasan"
                    aria-label="Hapus ulasan"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                )}
              </div>

              {item.komentar && <p className="ulasan-text">{item.komentar}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

