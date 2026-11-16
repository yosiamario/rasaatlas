/**
 * Uji integrasi API RasaAtlas dengan database sungguhan.
 *
 * Jalankan dari folder backend:
 *   npm test
 *
 * DATABASE_URL dibaca dari environment atau backend/.env. Bila kosong, seluruh
 * pengujian dilewati. Setiap data uji dibersihkan lagi di akhir.
 */
import 'dotenv/config'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { after, before, describe, test } from 'node:test'
import app from '../src/app.js'
import { closePool, ensureSchema, pool, query } from '../src/db.js'
import { applyMigrations } from '../src/migrate.js'

const adaDatabase = Boolean(process.env.DATABASE_URL?.trim())
const akhiran = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const emailUji = `uji-${akhiran}@rasaatlas.test`
const namaUji = `Warung Uji ${akhiran}`

let server
let baseUrl
let token
let userId
let tempatId
let tempatSlug

async function panggil(path, { method = 'GET', body, bearer } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const teks = await res.text()
  let json = null
  try {
    json = teks ? JSON.parse(teks) : null
  } catch {
    json = teks
  }

  return { status: res.status, body: json }
}

describe('RasaAtlas API', { skip: !adaDatabase && 'DATABASE_URL belum diset' }, () => {
  before(async () => {
    await ensureSchema()
    server = createServer(app)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    if (tempatId) await query('DELETE FROM tempat WHERE dibuat_oleh = $1', [userId || -1])
    if (userId) await query('DELETE FROM users WHERE id = $1', [userId])
    if (server) await new Promise((resolve) => server.close(resolve))
    await closePool()
  })

  test('migrasi tercatat dan idempotent', async () => {
    const hasil = await applyMigrations((text, params) => pool.query(text, params))
    assert.deepEqual(hasil.applied, [], 'migrasi kedua tidak boleh menerapkan ulang')
    assert.ok(hasil.skipped.includes('001_init'))
  })

  test('GET /health mengembalikan status ok', async () => {
    const { status, body } = await panggil('/health')
    assert.equal(status, 200)
    assert.equal(body.status, 'ok')
    assert.equal(typeof body.tempat, 'number')
  })

  test('GET /tempat mengembalikan list dan meta', async () => {
    const { status, body } = await panggil('/tempat?limit=3')
    assert.equal(status, 200)
    assert.ok(Array.isArray(body.data))
    assert.ok(body.data.length <= 3)
    assert.equal(body.meta.limit, 3)
    assert.ok(body.meta.total >= body.data.length)
    assert.ok(body.data[0].slug)

    const detail = await panggil(`/tempat/${body.data[0].slug}`)
    assert.equal(detail.status, 200)
    assert.equal(detail.body.data.slug, body.data[0].slug)
    assert.ok(Array.isArray(detail.body.terkait))
  })

  test('GET /tempat/:id yang tidak ada menghasilkan 404', async () => {
    const { status, body } = await panggil('/tempat/tidak-ada-tempat-ini')
    assert.equal(status, 404)
    assert.equal(body.error.code, 'NOT_FOUND')
  })

  test('POST /tempat menolak pengguna yang belum masuk', async () => {
    const { status, body } = await panggil('/tempat', {
      method: 'POST',
      body: { nama: namaUji, alamat: 'Jl. Uji No. 1', kategori_id: 1, harga: 10000 },
    })
    assert.equal(status, 401)
    assert.equal(body.error.code, 'UNAUTHORIZED')
  })

  test('registrasi akun baru berhasil', async () => {
    const { status, body } = await panggil('/auth/register', {
      method: 'POST',
      body: { nama: 'Penguji RasaAtlas', email: emailUji, password: 'rahasia123', nim: '2401019999' },
    })
    assert.equal(status, 201)
    assert.equal(typeof body.token, 'string')
    assert.equal(body.user.email, emailUji)
    assert.equal(body.user.password_hash, undefined)

    token = body.token
    userId = body.user.id

    const ganda = await panggil('/auth/register', {
      method: 'POST',
      body: { nama: 'Penguji Lain', email: emailUji, password: 'rahasia123' },
    })
    assert.equal(ganda.status, 409)
    assert.equal(ganda.body.error.code, 'EMAIL_TAKEN')
  })

  test('login menolak password salah', async () => {
    const { status } = await panggil('/auth/login', {
      method: 'POST',
      body: { email: emailUji, password: 'salah-sekali' },
    })
    assert.equal(status, 401)
  })

  test('POST /tempat memvalidasi input', async () => {
    const namaPendek = await panggil('/tempat', {
      method: 'POST',
      bearer: token,
      body: { nama: 'A', alamat: 'Jl. Uji No. 1', kategori_id: 1, harga: 10000 },
    })
    assert.equal(namaPendek.status, 400)
    assert.equal(namaPendek.body.error.code, 'VALIDATION')

    const koordinatSetengah = await panggil('/tempat', {
      method: 'POST',
      bearer: token,
      body: {
        nama: namaUji,
        alamat: 'Jl. Uji No. 1',
        kategori_id: 1,
        harga: 10000,
        lat: -6.99,
      },
    })
    assert.equal(koordinatSetengah.status, 400)

    const kategoriSalah = await panggil('/tempat', {
      method: 'POST',
      bearer: token,
      body: { nama: namaUji, alamat: 'Jl. Uji No. 1', kategori_id: 999, harga: 10000 },
    })
    assert.equal(kategoriSalah.status, 400)
  })

  test('POST /tempat menyimpan tempat baru sebagai kontribusi pengguna', async () => {
    const { status, body } = await panggil('/tempat', {
      method: 'POST',
      bearer: token,
      body: {
        nama: namaUji,
        kategori_id: 1,
        alamat: 'Jl. Uji No. 1, Semarang Tengah',
        harga: 15000,
        jam_buka: '10.00-20.00',
        deskripsi: 'Tempat uji otomatis.',
        foto_url: '/images/tempat/nasi-ayam.jpg',
        lat: -6.982,
        lng: 110.409,
      },
    })

    assert.equal(status, 201)
    assert.equal(body.data.nama, namaUji)
    assert.equal(body.data.sumber, 'pengguna')
    assert.equal(body.data.dibuat_oleh, userId)
    assert.equal(body.data.kontributor, 'Penguji RasaAtlas')
    assert.equal(body.data.rating, 0)
    assert.equal(body.data.harga, 15000)
    assert.equal(body.data.lat, -6.982)
    assert.equal(body.data.lng, 110.409)
    assert.match(body.data.slug, /^warung-uji-/)

    tempatId = body.data.id
    tempatSlug = body.data.slug

    const detail = await panggil(`/tempat/${tempatSlug}`)
    assert.equal(detail.status, 200)
    assert.equal(detail.body.data.id, tempatId)

    const cari = await panggil(`/tempat?q=${encodeURIComponent(akhiran)}`, { bearer: token })
    assert.equal(cari.status, 200)
    assert.ok(cari.body.data.some((item) => item.id === tempatId), 'tempat baru muncul di pencarian')

    const daftarKontribusi = await panggil('/tempat?sort=terbaru&limit=5', { bearer: token })
    assert.ok(
      daftarKontribusi.body.data.some((item) => item.id === tempatId),
      'tempat baru muncul di urutan terbaru',
    )
  })

  test('nama yang sama mendapat slug unik', async () => {
    const { status, body } = await panggil('/tempat', {
      method: 'POST',
      bearer: token,
      body: {
        nama: namaUji,
        kategori_id: 1,
        alamat: 'Jl. Uji No. 2, Semarang Tengah',
        harga: 12000,
      },
    })

    assert.equal(status, 201)
    assert.notEqual(body.data.slug, tempatSlug)
    assert.equal(body.data.slug, `${tempatSlug}-2`)
  })

  test('PUT /auth/me memperbarui profil', async () => {
    const { status, body } = await panggil('/auth/me', {
      method: 'PUT',
      bearer: token,
      body: { nama: 'Penguji RasaAtlas', nim: '2401019999', bio: 'Suka kuliner Semarang.' },
    })
    assert.equal(status, 200)
    assert.equal(body.user.bio, 'Suka kuliner Semarang.')

    const me = await panggil('/auth/me', { bearer: token })
    assert.equal(me.status, 200)
    assert.equal(me.body.user.bio, 'Suka kuliner Semarang.')
  })

  test('GET /tempat/saya mengembalikan kontribusi pengguna', async () => {
    const { status, body } = await panggil('/tempat/saya', { bearer: token })
    assert.equal(status, 200)
    assert.ok(Array.isArray(body.data))
    assert.ok(body.data.some((t) => t.id === tempatId))
  })

  test('PUT /tempat/:id memperbarui data tempat sendiri', async () => {
    const { status, body } = await panggil(`/tempat/${tempatId}`, {
      method: 'PUT',
      bearer: token,
      body: {
        nama: `${namaUji} Diperbarui`,
        alamat: 'Jl. Uji No. 10, Semarang',
        kategori_id: 1,
        harga: 20000,
        deskripsi: 'Deskripsi diperbarui.',
      },
    })
    assert.equal(status, 200)
    assert.equal(body.data.nama, `${namaUji} Diperbarui`)
    assert.equal(body.data.harga, 20000)
  })

  test('POST dan GET /favorit mengelola bookmark tempat', async () => {
    const tambah = await panggil(`/favorit/${tempatId}`, {
      method: 'POST',
      bearer: token,
    })
    assert.equal(tambah.status, 201)

    const daftar = await panggil('/favorit', { bearer: token })
    assert.equal(daftar.status, 200)
    assert.ok(daftar.body.data.some((f) => f.id === tempatId))

    const hapus = await panggil(`/favorit/${tempatId}`, {
      method: 'DELETE',
      bearer: token,
    })
    assert.equal(hapus.status, 200)
  })

  test('POST dan GET /tempat/:id/ulasan mengelola ulasan & rating', async () => {
    const ulas = await panggil(`/tempat/${tempatId}/ulasan`, {
      method: 'POST',
      bearer: token,
      body: { rating: 5, komentar: 'Sangat lezat dan porsi banyak!' },
    })
    assert.equal(ulas.status, 201)
    assert.equal(ulas.body.data.rating, 5)

    const list = await panggil(`/tempat/${tempatId}/ulasan`)
    assert.equal(list.status, 200)
    assert.ok(list.body.data.length > 0)
    assert.equal(list.body.data[0].komentar, 'Sangat lezat dan porsi banyak!')
  })
})
