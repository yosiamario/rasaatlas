import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  LocateFixed,
  MapPin,
  Plus,
  Sparkles,
} from 'lucide-react'
import { api, fotoUrl } from '../lib/api'
import { useApi } from '../hooks/useApi'
import LocationPicker from '../components/LocationPicker'

const AWAL = {
  nama: '',
  kategori_id: '',
  alamat: '',
  harga: '',
  jam_buka: '',
  deskripsi: '',
  foto_url: '',
  lat: '',
  lng: '',
}

function validasi(form) {
  if (form.nama.trim().length < 2 || form.nama.trim().length > 80) {
    return 'Nama tempat harus 2–80 karakter.'
  }
  if (!form.kategori_id) return 'Pilih kategori tempat.'
  if (form.alamat.trim().length < 5 || form.alamat.trim().length > 200) {
    return 'Alamat harus 5–200 karakter.'
  }
  const harga = Number(form.harga)
  if (!Number.isInteger(harga) || harga < 0 || harga > 10_000_000) {
    return 'Harga harus bilangan bulat antara 0 dan 10.000.000.'
  }
  if (form.jam_buka.trim().length > 100) return 'Jam buka maksimal 100 karakter.'
  if (form.deskripsi.length > 500) return 'Deskripsi maksimal 500 karakter.'
  if (form.foto_url.trim().length > 500) return 'URL foto maksimal 500 karakter.'
  if (
    form.foto_url.trim() &&
    !/^https?:\/\/\S+$/i.test(form.foto_url.trim()) &&
    !(form.foto_url.trim().startsWith('/') && !form.foto_url.trim().startsWith('//'))
  ) {
    return 'URL foto harus diawali http(s):// atau berupa path /images/...'
  }
  const adaLat = form.lat !== ''
  const adaLng = form.lng !== ''
  if (adaLat !== adaLng) return 'Isi latitude dan longitude sekaligus, atau kosongkan keduanya.'
  if (adaLat) {
    const lat = Number(form.lat)
    const lng = Number(form.lng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'Latitude tidak valid.'
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return 'Longitude tidak valid.'
  }
  return ''
}

export default function TambahTempat() {
  const navigate = useNavigate()
  const [form, setForm] = useState(AWAL)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)

  const { data: kategoriData, loading: kategoriLoading, error: kategoriError, reload } =
    useApi(() => api.kategori(), [])
  const kategori = kategoriData?.data || []

  const ubah = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const pilihTitik = ({ lat, lng }) => {
    setGeoError('')
    setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))
  }

  const lokasiSaya = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser ini tidak mendukung deteksi lokasi.')
      return
    }
    setGeoError('')
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        pilihTitik({
          lat: Number(posisi.coords.latitude.toFixed(6)),
          lng: Number(posisi.coords.longitude.toFixed(6)),
        })
        setGeoLoading(false)
      },
      () => {
        setGeoError('Lokasi tidak bisa diambil. Klik peta secara manual.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const hapusTitik = () => {
    setForm((f) => ({ ...f, lat: '', lng: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    const pesan = validasi(form)
    if (pesan) {
      setError(pesan)
      return
    }

    setSaving(true)
    try {
      const { data } = await api.createTempat({
        nama: form.nama.trim(),
        kategori_id: Number(form.kategori_id),
        alamat: form.alamat.trim(),
        harga: Number(form.harga),
        jam_buka: form.jam_buka.trim(),
        deskripsi: form.deskripsi.trim(),
        foto_url: form.foto_url.trim(),
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
      })
      navigate(`/tempat/${data.slug}?baru=1`, { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal menyimpan tempat. Coba lagi.')
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <Link className="back-link" to="/tempat">
          <ArrowLeft aria-hidden="true" /> Kembali ke katalog
        </Link>

        <div className="tambah-head">
          <span className="eyebrow">Kontribusi pengguna</span>
          <h1 className="display">Tambah tempat</h1>
          <p className="lede">
            Punya warung langganan yang belum ada di atlas? Bagikan namanya, alamatnya, dan
            kisaran harganya. Tempat baru akan langsung tampil di katalog.
          </p>
        </div>

        <form className="tambah-grid" onSubmit={submit} noValidate>
          <section className="panel" aria-labelledby="info-tempat">
            <h2 id="info-tempat">Informasi tempat</h2>
            <p>Kolom bertanda * wajib diisi. Data bisa diperbaiki nanti lewat admin.</p>

            <div className="form">
              <div className="field">
                <label htmlFor="nama">Nama tempat *</label>
                <input
                  id="nama"
                  type="text"
                  value={form.nama}
                  onChange={(e) => ubah('nama', e.target.value)}
                  maxLength={80}
                  placeholder="Contoh: Warung Soto Pak Slamet"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="kategori">Kategori *</label>
                <select
                  id="kategori"
                  value={form.kategori_id}
                  onChange={(e) => ubah('kategori_id', e.target.value)}
                  disabled={kategoriLoading}
                  required
                >
                  <option value="">
                    {kategoriLoading ? 'Memuat kategori…' : 'Pilih kategori'}
                  </option>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ikon} {k.nama}
                    </option>
                  ))}
                </select>
                {kategoriError && (
                  <span className="hint">
                    Gagal memuat kategori.{' '}
                    <button type="button" className="link-button" onClick={reload}>
                      Coba lagi
                    </button>
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="alamat">Alamat *</label>
                <textarea
                  id="alamat"
                  value={form.alamat}
                  onChange={(e) => ubah('alamat', e.target.value)}
                  maxLength={200}
                  placeholder="Nama jalan, nomor, kelurahan, kecamatan"
                  required
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="harga">Kisaran harga *</label>
                  <input
                    id="harga"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="10000000"
                    step="1000"
                    value={form.harga}
                    onChange={(e) => ubah('harga', e.target.value)}
                    placeholder="25000"
                    required
                  />
                  <span className="hint">Rupiah per orang.</span>
                </div>

                <div className="field">
                  <label htmlFor="jam">Jam buka</label>
                  <input
                    id="jam"
                    type="text"
                    value={form.jam_buka}
                    onChange={(e) => ubah('jam_buka', e.target.value)}
                    maxLength={100}
                    placeholder="08.00–21.00"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="deskripsi">Deskripsi</label>
                <textarea
                  id="deskripsi"
                  value={form.deskripsi}
                  onChange={(e) => ubah('deskripsi', e.target.value)}
                  maxLength={500}
                  placeholder="Apa yang membuat tempat ini istimewa? Menu andalan, suasana, atau tips berkunjung."
                />
                <span className="hint">{form.deskripsi.length}/500 karakter</span>
              </div>

              <div className="field">
                <label htmlFor="foto">URL foto</label>
                <input
                  id="foto"
                  type="url"
                  value={form.foto_url}
                  onChange={(e) => ubah('foto_url', e.target.value)}
                  maxLength={500}
                  placeholder="https://… (opsional)"
                />
                <span className="hint">
                  Kosongkan untuk memakai ilustrasi default. Pastikan kamu berhak memakai fotonya.
                </span>
              </div>
            </div>
          </section>

          <div className="panel-stack">
            <section className="panel" aria-labelledby="lokasi-tempat">
              <h2 id="lokasi-tempat">Titik lokasi</h2>
              <p>Opsional, tetapi sangat membantu orang menemukan tempatnya.</p>

              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={pilihTitik}
              />

              <div className="coord-grid">
                <div className="field">
                  <label htmlFor="lat">Latitude</label>
                  <input
                    id="lat"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={form.lat}
                    onChange={(e) => ubah('lat', e.target.value)}
                    placeholder="-6.9667"
                  />
                </div>
                <div className="field">
                  <label htmlFor="lng">Longitude</label>
                  <input
                    id="lng"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={form.lng}
                    onChange={(e) => ubah('lng', e.target.value)}
                    placeholder="110.4167"
                  />
                </div>
              </div>

              <div className="map-actions">
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={lokasiSaya}
                  disabled={geoLoading}
                >
                  <LocateFixed aria-hidden="true" />
                  {geoLoading ? 'Mencari lokasi…' : 'Gunakan lokasi saya'}
                </button>
                {(form.lat || form.lng) && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={hapusTitik}>
                    Hapus titik
                  </button>
                )}
              </div>

              {geoError && (
                <p className="form-error" role="alert">
                  <AlertCircle aria-hidden="true" /> {geoError}
                </p>
              )}
            </section>

            <section className="panel" aria-labelledby="pratinjau">
              <h2 id="pratinjau">Pratinjau</h2>
              <p>Begini gambarnya di halaman detail.</p>

              <div className="preview-foto">
                <img
                  src={fotoUrl(form.foto_url.trim())}
                  alt="Pratinjau foto tempat"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg'
                  }}
                />
              </div>

              <div className="preview-note">
                <Sparkles aria-hidden="true" />
                <span>
                  Tempat baru tampil dengan label <strong>Baru</strong> sampai rating
                  dikurasi. Kontributor akan tercatat di halaman detail.
                </span>
              </div>
            </section>
          </div>

          {error && (
            <p className="form-error tambah-error" role="alert">
              <AlertCircle aria-hidden="true" /> {error}
            </p>
          )}

          <div className="tambah-actions">
            <Link className="btn btn-ghost" to="/tempat">
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>Menyimpan…</>
              ) : (
                <>
                  <Plus aria-hidden="true" /> Simpan tempat
                </>
              )}
            </button>
          </div>

          <p className="form-footnote">
            <MapPin aria-hidden="true" /> Data yang kamu kirim akan tampil publik dan bisa
            dikurasi ulang oleh pengelola RasaAtlas.
          </p>
        </form>
      </div>
    </div>
  )
}
