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
  tempat(params) {
    return request(`/tempat${qs(params)}`)
  },
  tempatDetail(id) {
    return request(`/tempat/${encodeURIComponent(id)}`)
  },
  kategori() {
    return request('/kategori')
  },
  kategoriDetail(id) {
    return request(`/kategori/${encodeURIComponent(id)}/tempat`)
  },
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
  health() {
    return request('/health')
  },
}

/** Gambar dari API berupa path publik frontend; biarkan apa adanya. */
export function fotoUrl(path) {
  if (!path) return '/images/placeholder.svg'
  return path
}
