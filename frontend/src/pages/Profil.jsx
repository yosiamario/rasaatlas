import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Heart,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Moon,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  UserCheck,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from '../context/I18nContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { inisial, tanggalPanjang } from '../lib/format'
import ImageUploader from '../components/ImageUploader'

const MATA_KULIAH = 'Praktikum Pemrograman Perangkat Bergerak (PWA)'

export default function Profil() {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { lang, toggleLang, t } = useTranslation()
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt()

  // Form profil
  const [form, setForm] = useState({ nama: '', nim: '', bio: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  // Ganti password
  const [pwdForm, setPwdForm] = useState({ lama: '', baru: '', konfirmasi: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdFeedback, setPwdFeedback] = useState('')
  const [pwdError, setPwdError] = useState('')

  // Verifikasi email
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(Boolean(user?.email_verified))

  // Hapus akun
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [delPassword, setDelPassword] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [delError, setDelError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        nama: user.nama || '',
        nim: user.nim || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
      })
      setEmailVerified(Boolean(user.email_verified))
    }
  }, [user?.id, user?.avatar_url, user?.email_verified])

  if (!user) return null

  const submitProfil = async (e) => {
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
        avatar_url: form.avatar_url.trim(),
      })
      setFeedback('Profil berhasil diperbarui.')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdFeedback('')

    if (pwdForm.baru.length < 8) {
      setPwdError('Password baru minimal 8 karakter.')
      return
    }
    if (pwdForm.baru !== pwdForm.konfirmasi) {
      setPwdError('Konfirmasi password baru tidak cocok.')
      return
    }

    setPwdSaving(true)
    try {
      await api.changePassword({
        password_lama: pwdForm.lama,
        password_baru: pwdForm.baru,
      })
      setPwdFeedback('Password Anda berhasil diperbarui.')
      setPwdForm({ lama: '', baru: '', konfirmasi: '' })
      setTimeout(() => setPwdFeedback(''), 3000)
    } catch (err) {
      setPwdError(err.message || 'Gagal mengganti password.')
    } finally {
      setPwdSaving(false)
    }
  }

  const verifikasiEmailSekarang = async () => {
    setVerifyingEmail(true)
    try {
      await api.verifyEmail()
      setEmailVerified(true)
      setFeedback('Email Anda berhasil diverifikasi!')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi email.')
    } finally {
      setVerifyingEmail(false)
    }
  }

  const prosesHapusAkun = async (e) => {
    e.preventDefault()
    setDelError('')
    setDelLoading(true)
    try {
      await api.deleteAccount(delPassword)
      logout()
      navigate('/masuk')
    } catch (err) {
      setDelError(err.message || 'Gagal menghapus akun.')
      setDelLoading(false)
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
            {form.avatar_url ? (
              <img
                src={fotoUrl(form.avatar_url)}
                alt=""
                className="avatar lg img-avatar"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span className="avatar lg" aria-hidden="true">
                {inisial(user.nama)}
              </span>
            )}

            <div className="profile-id">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{user.nama}</h1>
                {user.role === 'admin' && (
                  <span className="badge green" title="Akun Administrator">
                    <ShieldCheck aria-hidden="true" style={{ width: 13, height: 13 }} /> Admin
                  </span>
                )}
              </div>

              <span className="email">
                <Mail aria-hidden="true" /> {user.email}
                {emailVerified ? (
                  <span className="badge green badge-sm" title="Email terverifikasi">
                    <CheckCircle2 aria-hidden="true" style={{ width: 11, height: 11 }} /> Terverifikasi
                  </span>
                ) : (
                  <button
                    type="button"
                    className="link-button badge-sm"
                    onClick={verifikasiEmailSekarang}
                    disabled={verifyingEmail}
                    style={{ fontSize: 11.5, marginLeft: 6 }}
                  >
                    {verifyingEmail ? 'Memproses…' : 'Verifikasi email'}
                  </button>
                )}
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
              <Link className="btn btn-accent btn-sm" to="/tempat/tambah">
                <Plus aria-hidden="true" /> Tambah tempat
              </Link>
            </div>
          </div>

          {user.bio && <p className="profile-bio">{user.bio}</p>}

          {/* Quick Hub Links */}
          <div className="profile-quick-nav">
            <Link to="/kontribusi-saya" className="quick-nav-card">
              <UtensilsCrossed aria-hidden="true" />
              <div>
                <strong>Kontribusi Saya</strong>
                <span>Lihat dan perbaiki tempat yang Anda tambahkan</span>
              </div>
            </Link>

            <Link to="/favorit" className="quick-nav-card">
              <Heart aria-hidden="true" />
              <div>
                <strong>Tempat Favorit</strong>
                <span>Daftar tempat yang sudah Anda simpan</span>
              </div>
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin/moderasi" className="quick-nav-card admin">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Moderasi Admin</strong>
                  <span>Tinjau tempat baru kiriman pengguna</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="profile-grid">
          <div className="panel-stack">
            {/* Panel 1: Data Mahasiswa & Avatar */}
            <section className="panel" aria-labelledby="edit-profil">
              <h2 id="edit-profil">Informasi Akun & Avatar</h2>
              <p>Perbarui nama, NIM, foto profil, dan bio kamu.</p>

              <form className="form" onSubmit={submitProfil}>
                <div className="field">
                  <label>Foto Profil / Avatar</label>
                  <ImageUploader
                    value={form.avatar_url}
                    onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
                    label="Unggah foto avatar"
                  />
                </div>

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
                    placeholder="Mahasiswa, pencari soto, dan penikmat kuliner Semarang."
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
                    {saving ? 'Menyimpan…' : 'Simpan Perubahan Profil'}
                  </button>
                </div>
              </form>
            </section>

            {/* Panel 2: Ganti Password */}
            <section className="panel" aria-labelledby="ganti-password-title">
              <h2 id="ganti-password-title">Ganti Password</h2>
              <p>Pastikan akun Anda tetap aman dengan kata sandi yang kuat.</p>

              <form className="form" onSubmit={submitPassword}>
                <div className="field">
                  <label htmlFor="pwd-lama">Password saat ini</label>
                  <input
                    id="pwd-lama"
                    type="password"
                    value={pwdForm.lama}
                    onChange={(e) => setPwdForm((p) => ({ ...p, lama: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="pwd-baru">Password baru (min. 8 karakter)</label>
                  <input
                    id="pwd-baru"
                    type="password"
                    value={pwdForm.baru}
                    onChange={(e) => setPwdForm((p) => ({ ...p, baru: e.target.value }))}
                    minLength={8}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="pwd-konfirmasi">Konfirmasi password baru</label>
                  <input
                    id="pwd-konfirmasi"
                    type="password"
                    value={pwdForm.konfirmasi}
                    onChange={(e) => setPwdForm((p) => ({ ...p, konfirmasi: e.target.value }))}
                    minLength={8}
                    required
                  />
                </div>

                {pwdError && (
                  <p className="form-error" role="alert">
                    {pwdError}
                  </p>
                )}
                {pwdFeedback && (
                  <p className="form-success" role="status">
                    <Check aria-hidden="true" /> {pwdFeedback}
                  </p>
                )}

                <div>
                  <button type="submit" className="btn btn-soft" disabled={pwdSaving}>
                    <Lock aria-hidden="true" />
                    {pwdSaving ? 'Memperbarui…' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="panel-stack">
            {/* Panel 3: Preferensi Tema & Bahasa */}
            <section className="panel" aria-labelledby="tampilan-title">
              <h2 id="tampilan-title">Pengaturan Tampilan & Bahasa</h2>
              <p>Sesuaikan tema aplikasi dan bahasa antarmuka.</p>

              <div className="setting-rows">
                <div className="setting-item">
                  <div>
                    <strong>Tema Gelap (Dark Mode)</strong>
                    <span>Beralih antara tema krem terang dan tema malam gelap</span>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-soft btn-sm${isDark ? ' active' : ''}`}
                    onClick={toggleTheme}
                  >
                    {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                  </button>
                </div>

                <div className="setting-item">
                  <div>
                    <strong>Bahasa Antarmuka</strong>
                    <span>Pilih Bahasa Indonesia atau English</span>
                  </div>
                  <button type="button" className="btn btn-soft btn-sm" onClick={toggleLang}>
                    <Globe aria-hidden="true" />
                    {lang === 'id' ? 'English' : 'Indonesia'}
                  </button>
                </div>
              </div>
            </section>

            {/* Panel 4: PWA Install */}
            <section className="panel">
              <h2>Pasang Aplikasi (PWA)</h2>
              <p>
                RasaAtlas dapat dipasang di layar utama ponsel atau komputer dan tetap dapat
                dibuka secara offline.
              </p>

              <div className="stack-cta">
                {installed ? (
                  <span className="badge green">
                    <Check aria-hidden="true" style={{ width: 14, height: 14 }} /> Sudah terpasang
                  </span>
                ) : canInstall ? (
                  <button type="button" className="btn btn-primary" onClick={install}>
                    <Download aria-hidden="true" /> Pasang RasaAtlas Sekarang
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

            {/* Panel 5: Zona Bahaya (Hapus Akun) */}
            <section className="panel danger-zone">
              <h2 className="danger-text">Zona Bahaya</h2>
              <p>
                Menghapus akun akan menghapus profil, ulasan, dan daftar favorit Anda secara
                permanen.
              </p>

              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-ghost danger-text btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 aria-hidden="true" /> Hapus Akun Saya
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Modal Konfirmasi Hapus Akun */}
        {showDeleteModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-box">
              <div className="modal-head">
                <AlertTriangle aria-hidden="true" className="danger-text" />
                <h3>Hapus Akun Permanen?</h3>
              </div>
              <p>
                Tindakan ini tidak dapat dibatalkan. Masukkan password akun Anda untuk
                mengonfirmasi penghapusan akun <strong>{user.email}</strong>.
              </p>

              <form onSubmit={prosesHapusAkun}>
                <div className="field" style={{ marginTop: 14 }}>
                  <label htmlFor="confirm-del-pwd">Password Anda</label>
                  <input
                    id="confirm-del-pwd"
                    type="password"
                    value={delPassword}
                    onChange={(e) => setDelPassword(e.target.value)}
                    required
                  />
                </div>

                {delError && <p className="form-error" role="alert">{delError}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDelPassword('')
                      setDelError('')
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent btn-sm"
                    disabled={delLoading}
                  >
                    {delLoading ? 'Menghapus…' : 'Ya, Hapus Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
