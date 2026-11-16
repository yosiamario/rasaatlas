import { useRef, useState } from 'react'
import { Camera, Image as ImageIcon, Link as LinkIcon, Loader2, UploadCloud, X } from 'lucide-react'
import { api, fotoUrl } from '../lib/api'

/**
 * Kompres gambar di sisi klien menggunakan Canvas agar cepat diunggah
 */
function compressImage(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export default function ImageUploader({ value, onChange, label = 'Foto Tempat' }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'url'
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan.')
      return
    }

    setUploading(true)
    try {
      // 1. Kompres gambar
      const compressedDataUrl = await compressImage(file)

      // Jika offline, simpan langsung data URI agar tetap tampil dan bisa diantrekan
      if (!navigator.onLine) {
        onChange(compressedDataUrl)
        setUploading(false)
        return
      }

      // 2. Unggah ke backend
      const res = await api.uploadFoto(compressedDataUrl)
      onChange(res.url)
    } catch (err) {
      console.warn('[ImageUploader] upload gagal, fallback ke data URL lokal:', err)
      // Fallback ke data URL langsung bila endpoint gagal
      const reader = new FileReader()
      reader.onload = () => onChange(reader.result)
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files
        handleFileChange({ target: { files: [file] } })
      }
    }
  }

  const clearPhoto = () => {
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <label className="uploader-label">{label}</label>
        <div className="uploader-tabs">
          <button
            type="button"
            className={`uploader-tab${mode === 'upload' ? ' active' : ''}`}
            onClick={() => setMode('upload')}
          >
            <UploadCloud aria-hidden="true" /> Unggah File
          </button>
          <button
            type="button"
            className={`uploader-tab${mode === 'url' ? ' active' : ''}`}
            onClick={() => setMode('url')}
          >
            <LinkIcon aria-hidden="true" /> URL Web
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="uploader-url-field">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/... atau /images/..."
            className="input-field"
          />
          <span className="hint">
            Masukkan tautan gambar langsung dari internet atau path lokal /images/...
          </span>
        </div>
      ) : (
        <div
          className={`uploader-dropzone${value ? ' has-image' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !value && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="uploader-state">
              <Loader2 className="spinner" aria-hidden="true" />
              <span>Mengompres & mengunggah foto…</span>
            </div>
          ) : value ? (
            <div className="uploader-preview">
              <img
                src={fotoUrl(value)}
                alt="Pratinjau foto tempat"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder.svg'
                }}
              />
              <button
                type="button"
                className="btn-clear-photo"
                onClick={(e) => {
                  e.stopPropagation()
                  clearPhoto()
                }}
                title="Hapus foto"
                aria-label="Hapus foto"
              >
                <X aria-hidden="true" />
              </button>
              <div className="uploader-overlay">
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <Camera aria-hidden="true" /> Ganti Foto
                </button>
              </div>
            </div>
          ) : (
            <div className="uploader-empty">
              <div className="icon-circle">
                <ImageIcon aria-hidden="true" />
              </div>
              <strong>Pilih foto atau tarik ke sini</strong>
              <span>JPG, PNG, atau WebP (maksimal 5 MB)</span>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Camera aria-hidden="true" /> Buka Kamera / Galeri
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}

