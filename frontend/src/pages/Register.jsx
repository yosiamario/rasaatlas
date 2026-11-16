import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, UserPlus } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/profil'

  const [form, setForm] = useState({ nama: '', email: '', nim: '', password: '', konfirmasi: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.nama.trim().length < 2) {
      setError('Nama minimal 2 karakter.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Format email belum benar.')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (form.password !== form.konfirmasi) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setBusy(true)
    try {
      await register({
        nama: form.nama.trim(),
        email: form.email.trim(),
        nim: form.nim.trim(),
        password: form.password,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/images/tempat/latte-art.jpg"
      eyebrow="Bergabung dengan RasaAtlas"
      headline="Simpan identitasmu di atlas."
      quote="“Nama, NIM, dan catatan kecilmu akan muncul di halaman profil.”"
    >
      <h1>Buat akun</h1>
      <p>Cukup satu menit, tanpa verifikasi email.</p>

      <form className="form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="reg-nama">Nama lengkap</label>
          <input
            id="reg-nama"
            type="text"
            value={form.nama}
            onChange={change('nama')}
            autoComplete="name"
            placeholder="Nama sesuai KTM"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reg-nim">NIM</label>
          <input
            id="reg-nim"
            type="text"
            value={form.nim}
            onChange={change('nim')}
            inputMode="numeric"
            placeholder="2141720001"
            maxLength={20}
          />
          <span className="hint">Opsional — bisa diisi nanti di halaman profil.</span>
        </div>

        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={change('email')}
            autoComplete="email"
            placeholder="nama@email.com"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={form.password}
            onChange={change('password')}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reg-konfirmasi">Ulangi password</label>
          <input
            id="reg-konfirmasi"
            type="password"
            value={form.konfirmasi}
            onChange={change('konfirmasi')}
            autoComplete="new-password"
            placeholder="Ketik ulang password"
            required
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <UserPlus aria-hidden="true" />
          {busy ? 'Membuat akun…' : 'Daftar sekarang'}
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun?{' '}
        <Link to="/masuk" state={{ from }}>
          Masuk di sini <ArrowRight aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: '-2px' }} />
        </Link>
      </p>
    </AuthShell>
  )
}
