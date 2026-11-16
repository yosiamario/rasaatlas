import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, LogIn } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/profil'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal masuk. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/images/tempat/lumpia.jpg"
      eyebrow="Selamat datang kembali"
      headline="Meja kamu sudah disiapkan."
      quote="“Setiap warung punya cerita; atlas ini membantu menemukannya.”"
    >
      <h1>Masuk</h1>
      <p>Lanjutkan dengan akun RasaAtlas milikmu.</p>

      <form className="form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="nama@email.com"
            required
          />
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="login-password">Password</label>
            <Link to="/lupa-password" style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 600 }}>
              Lupa password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Minimal 8 karakter"
            required
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <LogIn aria-hidden="true" />
          {busy ? 'Memeriksa akun…' : 'Masuk ke RasaAtlas'}
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun?{' '}
        <Link to="/daftar" state={{ from }}>
          Daftar sekarang <ArrowRight aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: '-2px' }} />
        </Link>
      </p>
    </AuthShell>
  )
}
