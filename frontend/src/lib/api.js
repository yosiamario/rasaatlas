/**
 * Klien API RasaAtlas.
 * Base URL diatur lewat VITE_API_BASE_URL (lihat .env.example).
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
)

const TOKEN_KEY = 'rasaatlas.token'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* localStorage bisa diblokir di mode privat */
  }
}

async function request(path, { method = 'GET', body, signal, auth = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const timeout = AbortSignal.timeout(15000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Permintaan dibatalkan.', { code: 'ABORTED' })
    }
    if (err.name === 'TimeoutError') {
      throw new ApiError('Server terlalu lama merespons. Coba lagi.', { code: 'TIMEOUT' })
    }
    throw new ApiError(
      'Tidak bisa menghubungi server. Periksa koneksi internetmu lalu coba lagi.',
      { code: 'NETWORK' },
    )
  }

  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    throw new ApiError(payload?.error?.message || `Permintaan gagal (${res.status}).`, {
      status: res.status,
      code: payload?.error?.code || 'HTTP_ERROR',
      details: payload?.error,
    })
  }

  return payload
}

const qs = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const str = search.toString()
  return str ? `?${str}` : ''
}

export const api = {
  // Tempat
  tempat(params) {
    return request(`/tempat${qs(params)}`, { auth: true })
  },
  tempatDetail(id) {
    return request(`/tempat/${encodeURIComponent(id)}`, { auth: true })
  },
  createTempat(data) {
    return request('/tempat', { method: 'POST', body: data, auth: true })
  },
  updateTempat(id, data) {
    return request(`/tempat/${encodeURIComponent(id)}`, { method: 'PUT', body: data, auth: true })
  },
  deleteTempat(id) {
    return request(`/tempat/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true })
  },
  tempatSaya() {
    return request('/tempat/saya', { auth: true })
  },
  tempatModerasi(params) {
    return request(`/tempat/moderasi${qs(params)}`, { auth: true })
  },
  updateModerasi(id, data) {
    return request(`/tempat/${encodeURIComponent(id)}/moderasi`, {
      method: 'PATCH',
      body: data,
      auth: true,
    })
  },

  // Ulasan
  ulasan(tempatId) {
    return request(`/tempat/${encodeURIComponent(tempatId)}/ulasan`)
  },
  createUlasan(tempatId, data) {
    return request(`/tempat/${encodeURIComponent(tempatId)}/ulasan`, {
      method: 'POST',
      body: data,
      auth: true,
    })
  },
  deleteUlasan(tempatId, ulasanId) {
    return request(
      `/tempat/${encodeURIComponent(tempatId)}/ulasan/${encodeURIComponent(ulasanId)}`,
      { method: 'DELETE', auth: true },
    )
  },

  // Favorit
  favorit() {
    return request('/favorit', { auth: true })
  },
  addFavorit(tempatId) {
    return request(`/favorit/${encodeURIComponent(tempatId)}`, { method: 'POST', auth: true })
  },
  removeFavorit(tempatId) {
    return request(`/favorit/${encodeURIComponent(tempatId)}`, { method: 'DELETE', auth: true })
  },

  // Upload
  uploadFoto(dataUrl) {
    return request('/upload', { method: 'POST', body: { data: dataUrl }, auth: true })
  },

  // Kategori
  kategori() {
    return request('/kategori')
  },
  kategoriDetail(id) {
    return request(`/kategori/${encodeURIComponent(id)}/tempat`)
  },

  // Auth & Akun
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: credentials })
  },
  register(data) {
    return request('/auth/register', { method: 'POST', body: data })
  },
  me() {
    return request('/auth/me', { auth: true })
  },
  updateMe(data) {
    return request('/auth/me', { method: 'PUT', body: data, auth: true })
  },
  changePassword(data) {
    return request('/auth/password', { method: 'PUT', body: data, auth: true })
  },
  forgotPassword(email) {
    return request('/auth/forgot-password', { method: 'POST', body: { email } })
  },
  resetPassword(data) {
    return request('/auth/reset-password', { method: 'POST', body: data })
  },
  verifyEmail() {
    return request('/auth/verify-email', { method: 'POST', auth: true })
  },
  deleteAccount(password) {
    return request('/auth/me', { method: 'DELETE', body: { password }, auth: true })
  },

  health() {
    return request('/health')
  },
}

/** Gambar dari API berupa path publik frontend atau path upload server */
export function fotoUrl(path) {
  if (!path) return '/images/placeholder.svg'
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  if (path.startsWith('/uploads/')) {
    return `${API_BASE}${path}`
  }
  return path
}
