import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Check,
  Download,
  ExternalLink,
  LogOut,
  Mail,
  Save,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { inisial, tanggalPanjang } from '../lib/format'

const MATA_KULIAH = 'Praktikum Pemrograman Perangkat Bergerak (PWA)'

export default function Profil() {
  const { user, updateProfile, logout } = useAuth()
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt()

  const [form, setForm] = useState({ nama: '', nim: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({ nama: user.nama || '', nim: user.nim || '', bio: user.bio || '' })
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFeedback('')
    if (form.nama.trim().length < 2) {
      setError('Nama minimal 2 karakter.')
      return
    }
    if (form.nim.trim().length > 20) {
      setError('NIM maksimal 20 karakter.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        nama: form.nama.trim(),
        nim: form.nim.trim(),
        bio: form.bio.trim(),
      })
      setFeedback('Profil berhasil diperbarui.')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const install = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') setFeedback('RasaAtlas berhasil dipasang.')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="profile-hero">
          <div className="profile-head">
            <span className="avatar lg" aria-hidden="true">
              {inisial(user.nama)}
            </span>
            <div className="profile-id">
              <h1>{user.nama}</h1>
              <span className="email">
                <Mail aria-hidden="true" /> {user.email}
              </span>
              <div className="profile-meta">
                <span className="badge">
                  <UserRound aria-hidden="true" style={{ width: 13, height: 13 }} />
                  NIM {user.nim || 'belum diisi'}
                </span>
                <span className="badge">
                  <BookOpen aria-hidden="true" style={{ width: 13, height: 13 }} />
                  {MATA_KULIAH}
                </span>
                {user.dibuat_pada && (
                  <span className="badge">Bergabung {tanggalPanjang(user.dibuat_pada)}</span>
                )}
              </div>
            </div>
            <div className="profile-actions">
              <button type="button" className="btn btn-soft btn-sm" onClick={logout}>
                <LogOut aria-hidden="true" /> Keluar
              </button>
              <Link className="btn btn-soft btn-sm" to="/tempat">
                Jelajahi katalog
              </Link>
            </div>
          </div>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
        </div>

        <div className="profile-grid">
          <section className="panel" aria-labelledby="edit-profil">
            <h2 id="edit-profil">Data mahasiswa</h2>
            <p>Nama dan NIM ini tampil di halaman profil sesuai akun yang masuk.</p>

            <form className="form" onSubmit={submit}>
              <div className="field">
                <label htmlFor="profil-nama">Nama lengkap</label>
                <input
                  id="profil-nama"
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="profil-nim">NIM</label>
                <input
                  id="profil-nim"
                  type="text"
                  value={form.nim}
                  onChange={(e) => setForm((f) => ({ ...f, nim: e.target.value }))}
                  inputMode="numeric"
                  placeholder="Contoh: 2141720001"
                />
              </div>

              <div className="field">
                <label htmlFor="profil-bio">Bio singkat</label>
                <textarea
                  id="profil-bio"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  maxLength={240}
                  placeholder="Mahasiswa, pencari soto, dan penggemar kopi susu."
                />
                <span className="hint">{form.bio.length}/240 karakter</span>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {feedback && (
                <p className="form-success" role="status">
                  <Check aria-hidden="true" /> {feedback}
                </p>
              )}

              <div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save aria-hidden="true" />
                  {saving ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
              </div>
            </form>
          </section>

          <div className="panel-stack">
            <section className="panel">
              <h2>Tentang proyek</h2>
              <p>Detail tugas dan teknologi yang dipakai.</p>
              <div className="info-list">
                <div className="info-row">
                  <span>Mata kuliah</span>
                  <strong>{MATA_KULIAH}</strong>
                </div>
                <div className="info-row">
                  <span>Frontend</span>
                  <strong>React 19 + Vite</strong>
                </div>
                <div className="info-row">
                  <span>Backend</span>
                  <strong>Express + SQLite</strong>
                </div>
                <div className="info-row">
                  <span>Sumber data</span>
                  <strong>OpenStreetMap + kurasi manual</strong>
                </div>
                <div className="info-row">
                  <span>PWA</span>
                  <strong>vite-plugin-pwa + Workbox</strong>
                </div>
              </div>
              <a
                className="link-arrow"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 14 }}
              >
                Atribusi data <ExternalLink aria-hidden="true" />
              </a>
            </section>

            <section className="panel">
              <h2>Pasang aplikasi</h2>
              <p>
                RasaAtlas bisa dibuka layaknya aplikasi: ikon di layar utama, tanpa address
                bar, dan tetap berfungsi saat offline.
              </p>

              <div className="stack-cta">
                {installed ? (
                  <span className="badge green">
                    <Check aria-hidden="true" style={{ width: 14, height: 14 }} /> Sudah terpasang
                  </span>
                ) : canInstall ? (
                  <button type="button" className="btn btn-primary" onClick={install}>
                    <Download aria-hidden="true" /> Install RasaAtlas
                  </button>
                ) : (
                  <p className="hint" style={{ fontSize: 12.5 }}>
                    <Smartphone
                      aria-hidden="true"
                      style={{ width: 15, height: 15, verticalAlign: '-2px', marginRight: 4 }}
                    />
                    {isIOS
                      ? 'Di iPhone: buka menu Bagikan → Tambah ke Layar Utama.'
                      : 'Buka menu browser (⋮) → “Install app” / “Tambahkan ke layar utama”.'}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
