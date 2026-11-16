import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import AuthShell from '../components/AuthShell'

export default function LupaPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Minta token, 2: Reset password
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [passwordBaru, setPasswordBaru] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleMintaToken = async (e) => {
    e.preventDefault()
    setError('')
    setFeedback('')
    setLoading(true)

    try {
      const res = await api.forgotPassword(email.trim())
      setFeedback(res.message || 'Token reset telah dibuat.')
      if (res.token_simulasi) {
        setToken(res.token_simulasi)
      }
      setStep(2)
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan reset password.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setFeedback('')

    if (passwordBaru.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }

    setLoading(true)
    try {
      await api.resetPassword({ token: token.trim(), password_baru: passwordBaru })
      setFeedback('Password berhasil diubah. Mengalihkan ke halaman masuk…')
      setTimeout(() => navigate('/masuk'), 2000)
    } catch (err) {
      setError(err.message || 'Gagal mereset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <AuthShell
          title={step === 1 ? 'Pemulihan Akun' : 'Buat Password Baru'}
          subtitle={
            step === 1
              ? 'Masukkan email yang terdaftar untuk menerima token reset password.'
              : 'Masukkan token reset dan buat kata sandi baru untuk akun Anda.'
          }
        >
          {step === 1 ? (
            <form className="form" onSubmit={handleMintaToken}>
              <div className="field">
                <label htmlFor="reset-email">Email terdaftar</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <Mail aria-hidden="true" />
                {loading ? 'Memproses…' : 'Kirim Token Reset'}
              </button>

              <div className="auth-switch">
                Ingat password Anda? <Link to="/masuk">Masuk di sini</Link>
              </div>
            </form>
          ) : (
            <form className="form" onSubmit={handleResetPassword}>
              <div className="field">
                <label htmlFor="reset-token">Token Reset</label>
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Salin token di sini"
                  required
                />
                <span className="hint">
                  {token ? 'Token terisi otomatis dari server demo.' : 'Periksa kotak masuk email Anda.'}
                </span>
              </div>

              <div className="field">
                <label htmlFor="reset-new-password">Password Baru</label>
                <input
                  id="reset-new-password"
                  type="password"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {feedback && (
                <p className="form-success" role="status">
                  <CheckCircle2 aria-hidden="true" /> {feedback}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <KeyRound aria-hidden="true" />
                {loading ? 'Menyimpan…' : 'Simpan Password Baru'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => setStep(1)}
                style={{ marginTop: 8 }}
              >
                <ArrowLeft aria-hidden="true" /> Ganti Email
              </button>
            </form>
          )}
        </AuthShell>
      </div>
    </div>
  )
}

