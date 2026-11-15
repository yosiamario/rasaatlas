# Panduan Deploy RasaAtlas

Tujuan: API Express + SQLite berjalan di **Render**, frontend React PWA di **Vercel**,
keduanya HTTPS. Semua langkah bisa dilakukan lewat dashboard (tanpa CLI) atau CLI.

> Sudah disediakan `render.yaml` (root repo) dan `frontend/vercel.json`.
> Deploy backend **lebih dulu** agar URL API sudah diketahui saat build frontend.

---

## 0. Sebelum mulai

1. Pastikan build lokal bersih:

   ```bash
   cd backend && npm install && npm run seed && npm start
   # terminal lain
   cd frontend && npm install && npm run build && npm run preview
   ```

2. Push repo ke GitHub (satu repo berisi `backend/` dan `frontend/`):

   ```bash
   git init
   git add .
   git commit -m "feat: RasaAtlas — katalog kuliner Semarang (PWA)"
   git branch -M main
   git remote add origin https://github.com/<username>/rasaatlas.git
   git push -u origin main
   ```

   Jangan commit `.env`, database `*.db`, atau `node_modules` (sudah ada `.gitignore`).

---

## 1. Deploy API ke Render

### Opsi A — Blueprint (paling cepat)

1. Render Dashboard → **New +** → **Blueprint**.
2. Pilih repo RasaAtlas. Render membaca `render.yaml` dan membuat service `rasaatlas-api`.
3. Saat diminta, isi:
   - `JWT_SECRET` → biarkan **Generate** (atau isi string acak 32+ karakter).
   - `CORS_ORIGIN` → sementara isi `http://localhost:5173` (nanti diganti domain Vercel).
4. **Apply** dan tunggu build selesai. Catat URL, mis.
   `https://rasaatlas-api.onrender.com`.
5. Uji: `https://rasaatlas-api.onrender.com/health` → `{"status":"ok","tempat":24,...}`.

### Opsi B — Web Service manual

- Root Directory: `backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`
- Environment:

| Key | Value |
| --- | --- |
| `NODE_VERSION` | `24.15.0` |
| `JWT_SECRET` | hasil `openssl rand -hex 32` (jangan dibagikan) |
| `CORS_ORIGIN` | `http://localhost:5173` (ganti setelah frontend jadi) |
| `DB_PATH` | `./data/rasaatlas.db` |

Saat pertama kali start, `app.js` mendeteksi database kosong dan otomatis menjalankan
seed (4 kategori, 24 tempat, 1 akun demo).

### Catatan SQLite di Render free

- File sistem Render free bersifat **ephemeral**: restart/redeploy menghapus database.
  Data seed otomatis dibuat ulang, tetapi akun pengguna yang didaftarkan akan hilang.
- Untuk penyimpanan permanen:
  1. Tambahkan **Disk** (berbayar) dengan mount path `/var/data`.
  2. Set `DB_PATH=/var/data/rasaatlas.db`.
  3. Redeploy. Database akan bertahan antar deploy.
- Alternatif gratis jangka panjang: migrasi ke Postgres/Supabase (perlu menyesuaikan
  `db.js`, `seed.js`, dan query di `routes/`).

---

## 2. Deploy frontend ke Vercel

### Dashboard

1. Vercel → **Add New → Project** → import repo yang sama.
2. **Root Directory**: `frontend`.
3. Framework Preset: **Vite** (otomatis). Build: `npm run build`, output: `dist`.
4. Environment Variables (Production + Preview):

   ```
   VITE_API_BASE_URL = https://rasaatlas-api.onrender.com
   ```

   Tanpa garis miring di akhir. Variabel `VITE_*` ditanam saat build, jadi setiap
   mengubahnya harus **Redeploy**.
5. Deploy. Catat domain, mis. `https://rasaatlas.vercel.app`.

### CLI (opsional)

```bash
cd frontend
vercel link
vercel env add VITE_API_BASE_URL production
# tempel URL API Render
vercel --prod
```

`vercel.json` sudah mengatur:

- rewrite SPA ke `index.html` (agar refresh `/tempat/soto-bangkong` tidak 404),
- `Cache-Control` untuk aset statis,
- service worker & manifest tidak di-cache lama,
- header keamanan dasar.

---

## 3. Hubungkan keduanya (CORS)

1. Buka service API di Render → **Environment**.
2. Ubah `CORS_ORIGIN` menjadi domain frontend, contoh:

   ```
   https://rasaatlas.vercel.app,https://rasaatlas-git-main-<user>.vercel.app
   ```

   Sertakan domain preview Vercel jika ingin memakainya. Pisahkan dengan koma, **tanpa**
   spasi tambahan dan tanpa `/` di akhir.
3. Simpan → Render redeploy otomatis.
4. Buka situs Vercel, pastikan daftar tempat muncul (bukan pesan offline).

Uji CORS dari terminal:

```bash
curl -i -H "Origin: https://rasaatlas.vercel.app" \
  https://rasaatlas-api.onrender.com/tempat?limit=2
# harus ada: access-control-allow-origin: https://rasaatlas.vercel.app
```

---

## 4. Verifikasi PWA

1. Buka situs HTTPS di Chrome/Edge.
2. **DevTools → Application**:
   - **Manifest**: nama, ikon 192 & 512, `display: standalone` terbaca.
   - **Service Workers**: status `activated and is running`.
3. **Application → Cache Storage**: `workbox-precache-*`, `rasaatlas-api`,
   `rasaatlas-images` terisi setelah navigasi.
4. Mode offline: Network → Offline → refresh halaman yang sudah dibuka.
5. Klik ikon **Install** di address bar, atau menu browser → “Install RasaAtlas”.
   Di iPhone: Safari → Bagikan → **Tambah ke Layar Utama**.
6. Lighthouse (Chrome DevTools → Lighthouse → kategori **PWA** + Performance,
   mode Desktop & Mobile).

> Lighthouse versi 12+ menghapus kategori PWA dari skor. Untuk checklist kuliah,
> gunakan Lighthouse 11:
>
> ```bash
> npx lighthouse@11 https://rasaatlas.vercel.app --preset=desktop --view
> ```
>
> Di lokal: `npm run preview` lalu
> `npx lighthouse@11 http://localhost:4173 --preset=desktop --view`.

---

## 5. Alternatif platform

### Netlify (frontend)

- Base directory: `frontend`, build `npm run build`, publish `dist`.
- Buat `frontend/public/_redirects` berisi `/* /index.html 200` (atau atur di
  `netlify.toml`).
- Set `VITE_API_BASE_URL` di Site settings → Environment variables, lalu redeploy.
- Tambahkan domain Netlify ke `CORS_ORIGIN` API.

### Railway / Fly.io (backend)

- Deploy folder `backend`, start `npm start`, set env yang sama seperti Render.
- Railway mendukung volume permanen untuk SQLite.

### GitHub Pages (frontend)

- Perlu `base: '/<repo>/'` di `vite.config.js` dan router `basename`, karena situs
  disajikan dari sub-path. Vercel/Netlify lebih sederhana untuk SPA + PWA.

---

## 6. Troubleshooting

| Gejala | Penyebab & solusi |
| --- | --- |
| “Tidak bisa menghubungi server” | `VITE_API_BASE_URL` salah/kosong → perbaiki env, **rebuild**. Cek API `/health`. |
| Error CORS di console | Domain frontend belum ada di `CORS_ORIGIN` (harus persis, tanpa slash). Simpan env → tunggu redeploy. |
| Refresh halaman detail 404 | Rewrite SPA belum aktif. Pastikan `vercel.json` terbaca (root `frontend`) atau `_redirects` Netlify. |
| API tidur lama (Render free) | Request pertama bisa 30–60 detik. Buka `/health` dulu sebelum demo. |
| PWA tidak bisa di-install | Harus HTTPS, manifest valid, ikon 192/512, service worker aktif. Cek Application → Manifest. |
| Ikon lama masih muncul | Unregister service worker (Application → Service Workers → Unregister) lalu hard reload. |
| `better-sqlite3` gagal build | Pastikan Node 24 di server (`NODE_VERSION`) dan jalankan `npm install` bersih, bukan menyalin `node_modules`. |
| Data pengguna hilang setelah deploy | Render free ephemeral. Tambahkan disk + `DB_PATH=/var/data/rasaatlas.db` atau migrasi DB. |
| Peta kosong | Tile OpenStreetMap butuh internet; saat offline peta menampilkan area abu-abu. Marker & tombol rute tetap tampil. |

---

## 7. Checklist setelah deploy

- [ ] `GET /health` API merespons `status: ok` dan `tempat: 24`.
- [ ] Frontend menampilkan 24 tempat (bukan error/offline).
- [ ] Daftar akun baru → login → halaman Profil menampilkan nama & NIM.
- [ ] Refresh di `/tempat/soto-bangkong` tidak 404.
- [ ] Manifest & service worker aktif, aplikasi bisa di-install.
- [ ] Mode offline menampilkan halaman yang sudah dikunjungi.
- [ ] Lighthouse (PWA/Performance/Accessibility) memuaskan.
- [ ] Screenshot desktop + mobile diperbarui untuk laporan demo.
