import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Save, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import LocationPicker from '../components/LocationPicker'
import ImageUploader from '../components/ImageUploader'
import { queueOfflineAction } from '../lib/offlineQueue'

export default function EditTempat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: detailData, loading: detailLoading, error: detailError } = useApi(
    () => api.tempatDetail(id),
    [id],
  )
  const tempat = detailData?.data

  const { data: kategoriData, loading: kategoriLoading } = useApi(() => api.kategori(), [])
  const kategori = kategoriData?.data || []

  const [form, setForm] = useState({
    nama: '',
    kategori_id: '',
    alamat: '',
    harga: '',
    jam_buka: '',
    deskripsi: '',
    foto_url: '',
    lat: '',
    lng: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (tempat) {
      setForm({
        nama: tempat.nama || '',
        kategori_id: String(tempat.kategori_id || ''),
        alamat: tempat.alamat || '',
        harga: String(tempat.harga ?? ''),
        jam_buka: tempat.jam_buka || '',
        deskripsi: tempat.deskripsi || '',
        foto_url: tempat.foto_url || '',
        lat: tempat.lat !== null && tempat.lat !== undefined ? String(tempat.lat) : '',
        lng: tempat.lng !== null && tempat.lng !== undefined ? String(tempat.lng) : '',
      })
    }
  }, [tempat])

  const ubah = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const pilihTitik = ({ lat, lng }) => {
    setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.nama.trim().length < 2) {
      setError('Nama tempat minimal 2 karakter.')
      return
    }
    if (!form.kategori_id) {
      setError('Pilih kategori tempat.')
      return
    }
    if (form.alamat.trim().length < 5) {
      setError('Alamat minimal 5 karakter.')
      return
    }

    const payload = {
      nama: form.nama.trim(),
      kategori_id: Number(form.kategori_id),
      alamat: form.alamat.trim(),
      harga: Number(form.harga || 0),
      jam_buka: form.jam_buka.trim(),
      deskripsi: form.deskripsi.trim(),
      foto_url: form.foto_url.trim(),
      lat: form.lat === '' ? null : Number(form.lat),
      lng: form.lng === '' ? null : Number(form.lng),
    }

    setSaving(true)

    // Tangani offline
    if (!navigator.onLine) {
      queueOfflineAction({
        type: 'update_tempat',
        id_target: tempat.id,
        payload,
      })
      alert('Perubahan disimpan secara offline dan akan disinkronkan saat terhubung kembali.')
      navigate(`/tempat/${tempat.slug || tempat.id}`)
      return
    }

    try {
      const res = await api.updateTempat(tempat.id, payload)
      navigate(`/tempat/${res.data.slug || res.data.id}`)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan tempat.')
      setSaving(false)
    }
  }

  const hapusTempat = async () => {
    if (!window.confirm(`Yakin ingin menghapus ${tempat.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }
    setDeleting(true)
    try {
      await api.deleteTempat(tempat.id)
      navigate('/tempat/saya')
    } catch (err) {
      alert(err.message || 'Gagal menghapus tempat.')
      setDeleting(false)
    }
  }

  if (detailLoading) {
    return (
      <div className="page">
        <div className="container">
          <p className="loading-state">Memuat data tempat…</p>
        </div>
      </div>
    )
  }

  if (detailError || !tempat) {
    return (
      <div className="page">
        <div className="container">
          <p className="form-error">Tempat tidak ditemukan atau terjadi kesalahan.</p>
          <Link to="/tempat" className="btn btn-soft btn-sm" style={{ marginTop: 12 }}>
            Kembali ke katalog
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user && user.id === tempat.dibuat_oleh
  const isAdmin = user && user.role === 'admin'
  if (!isOwner && !isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <p className="form-error">Anda tidak memiliki hak untuk mengedit tempat ini.</p>
          <Link to={`/tempat/${tempat.slug || tempat.id}`} className="btn btn-soft btn-sm" style={{ marginTop: 12 }}>
            Lihat halaman tempat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to={`/tempat/${tempat.slug || tempat.id}`}>
          <ArrowLeft aria-hidden="true" /> Kembali ke detail tempat
        </Link>

        <div className="tambah-head">
          <span className="eyebrow">Perbarui Data</span>
          <h1 className="display">Edit {tempat.nama}</h1>
          <p className="lede">
            Perbaiki informasi alamat, kisaran harga, jam operasional, atau foto tempat.
          </p>
        </div>

        <form className="tambah-grid" onSubmit={submit} noValidate>
          <section className="panel" aria-labelledby="info-tempat">
            <h2 id="info-tempat">Informasi Tempat</h2>
            <div className="form">
              <div className="field">
                <label htmlFor="edit-nama">Nama tempat *</label>
                <input
                  id="edit-nama"
                  type="text"
                  value={form.nama}
                  onChange={(e) => ubah('nama', e.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="edit-kategori">Kategori *</label>
                <select
                  id="edit-kategori"
                  value={form.kategori_id}
                  onChange={(e) => ubah('kategori_id', e.target.value)}
                  disabled={kategoriLoading}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ikon} {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="edit-alamat">Alamat *</label>
                <textarea
                  id="edit-alamat"
                  value={form.alamat}
                  onChange={(e) => ubah('alamat', e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="edit-harga">Kisaran harga *</label>
                  <input
                    id="edit-harga"
                    type="number"
                    value={form.harga}
                    onChange={(e) => ubah('harga', e.target.value)}
                    min="0"
                    max="10000000"
                    step="1000"
                    required
                  />
                  <span className="hint">Rupiah per orang</span>
                </div>

                <div className="field">
                  <label htmlFor="edit-jam">Jam buka</label>
                  <input
                    id="edit-jam"
                    type="text"
                    value={form.jam_buka}
                    onChange={(e) => ubah('jam_buka', e.target.value)}
                    maxLength={100}
                    placeholder="08.00–21.00"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="edit-deskripsi">Deskripsi</label>
                <textarea
                  id="edit-deskripsi"
                  value={form.deskripsi}
                  onChange={(e) => ubah('deskripsi', e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <span className="hint">{form.deskripsi.length}/500 karakter</span>
              </div>
            </div>
          </section>

          <div className="panel-stack">
            <section className="panel" aria-labelledby="foto-tempat">
              <h2 id="foto-tempat">Foto Tempat</h2>
              <ImageUploader
                value={form.foto_url}
                onChange={(url) => ubah('foto_url', url)}
                label="Unggah atau ubah foto"
              />
            </section>

            <section className="panel" aria-labelledby="lokasi-titik">
              <h2 id="lokasi-titik">Titik Peta</h2>
              <p>Geser penanda di peta untuk memperbarui titik koordinat tempat ini.</p>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={pilihTitik}
              />
            </section>
          </div>

          {error && (
            <p className="form-error tambah-error" role="alert">
              <AlertCircle aria-hidden="true" /> {error}
            </p>
          )}

          <div className="tambah-actions" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-ghost danger-text"
              onClick={hapusTempat}
              disabled={deleting}
            >
              <Trash2 aria-hidden="true" />
              {deleting ? 'Menghapus…' : 'Hapus Tempat Ini'}
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link className="btn btn-ghost" to={`/tempat/${tempat.slug || tempat.id}`}>
                Batal
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save aria-hidden="true" />
                {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

