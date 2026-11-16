# Supabase Setup — RasaAtlas

Backend RasaAtlas memakai **Supabase PostgreSQL** sebagai satu-satunya database
(sebelumnya SQLite). Semua tabel, akun, dan tempat kiriman pengguna tersimpan permanen
di Supabase, jadi tidak hilang saat Render restart/redeploy.

> Arsitektur: frontend → Express API → Supabase Postgres (`pg` pool).
> Frontend **tidak** memakai `@supabase/supabase-js` dan tidak pernah menerima
> `DATABASE_URL` maupun service key.

---

## 1. Buat project Supabase

1. Masuk ke <https://supabase.com/dashboard> → **New project**.
2. Isi nama project (mis. `rasaatlas`), password database yang kuat, dan region
   terdekat (mis. `Southeast Asia (Singapore)`).
3. Tunggu provisioning selesai (±2 menit).

## 2. Ambil connection string

Supabase Dashboard → **Project Settings → Database → Connection string → URI**.

Untuk server Express yang berjalan terus (Render/Railway/Fly), gunakan **Session
pooler** (port `5432` pada host pooler):

```text
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

- **Session pooler** — direkomendasikan untuk API ini. Koneksi persisten, cocok dengan
  `pg` Pool.
- **Direct connection** (`db.<project-ref>.supabase.co:5432`) juga bisa, tetapi di
  beberapa jaringan hanya IPv6.
- **Transaction pooler** (port `6543`) untuk fungsi serverless. Bisa dipakai, tetapi
  pastikan tidak memakai prepared statement bernama; kode ini hanya memakai query
  parameter biasa.

Jika password mengandung karakter khusus (`@`, `#`, `%`, `:`), URL-encode dulu
(contoh `@` → `%40`).

## 3. Isi `backend/.env`

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
JWT_SECRET=ganti-dengan-string-acak-panjang
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Jangan commit file `.env` (sudah masuk `.gitignore`).

## 4. Siapkan skema & data awal

Ada dua cara; pilih salah satu.

### Cara A — otomatis saat server start (paling mudah)

```bash
cd backend
npm install
npm start
```

Saat start, server:

1. menjalankan migrasi yang belum diterapkan (`schema.sql` sebagai `001_init`,
   lalu file di `db/migrations/`) dan mencatatnya di tabel `schema_migrations`,
2. mengecek tabel `tempat`,
3. mengisi 4 kategori, 24 tempat, dan akun demo bila masih kosong.

Ingin menyiapkan skema tanpa menyalakan server?

```bash
npm run migrate   # terapkan skema/migrasi saja
npm test          # uji integrasi API terhadap database ini
```

Health check: <http://localhost:4000/health> →
`{"status":"ok","database":"supabase","tempat":24,...}`.

### Cara B — manual lewat SQL Editor

1. Buka **SQL Editor** di dashboard Supabase.
2. Tempel seluruh isi [`backend/db/schema.sql`](../backend/db/schema.sql) → **Run**.
3. Isi data awal:

   ```bash
   cd backend
   npm run seed          # aman diulang (upsert)
   npm run seed:reset    # hapus semua lalu isi ulang (akun pengguna ikut terhapus)
   ```

Skema membuat tabel `users`, `kategori`, `tempat`, indeks, kolom kontribusi
(`dibuat_oleh`, `sumber`), dan mengaktifkan **Row Level Security** tanpa policy
publik. API tetap bisa membaca/menulis karena memakai koneksi Postgres langsung
(role owner), sedangkan akses anon via PostgREST tertutup.

## 5. Akun demo

| Email | Password |
| --- | --- |
| `demo@rasaatlas.id` | `demo12345` |

Akun ini hanya untuk demo. Ganti/hapus sebelum presentasi publik.

---

## 6. Deploy ke Render

Di Render → service API → **Environment**, tambahkan:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | connection string Supabase (session pooler) |
| `JWT_SECRET` | string acak 32+ karakter |
| `CORS_ORIGIN` | domain frontend Vercel |
| `PG_POOL_MAX` | `10` (opsional) |

`render.yaml` sudah menyiapkan variabel tersebut (`DATABASE_URL` dan `CORS_ORIGIN`
diisi manual saat membuat Blueprint). Setelah redeploy, cek
`https://<api>.onrender.com/health` dan pastikan `database: "supabase"`.

---

## 7. Alur data kontribusi pengguna

1. Pengguna masuk → membuka `/tempat/tambah`.
2. Form mengirim `POST /tempat` dengan Bearer token.
3. API memvalidasi input, membuat slug unik, lalu menyimpan baris dengan
   `sumber = 'pengguna'` dan `dibuat_oleh = id pengguna`.
4. Detail tempat menampilkan nama kontributor dan label **Baru** sampai rating
   dikurasi pengelola.
5. Tidak ada endpoint admin/moderasi; penghapusan/penyuntingan data dilakukan
   langsung lewat Table Editor Supabase atau SQL.

---

## 8. Troubleshooting

| Gejala | Solusi |
| --- | --- |
| `DATABASE_URL belum diset` | Isi `backend/.env` atau environment Render. Restart server. |
| `password authentication failed` | Cek password/URL-encode karakter khusus; salin ulang connection string. |
| `ECONNREFUSED` / timeout | Jaringan mungkin hanya IPv4; pakai host **pooler**, bukan direct `db.*`. |
| `self signed certificate` | Kode sudah memakai TLS tanpa verifikasi rantai untuk host non-lokal. Pastikan tidak mengubah opsi `ssl`. |
| Tabel tidak ditemukan | Jalankan `backend/db/schema.sql` di SQL Editor atau start server sekali. |
| Data ganda setelah seed | Seed memakai `ON CONFLICT`; `npm run seed:reset` untuk bersih total. |
| Ingin mulai dari nol | SQL Editor: `TRUNCATE tempat, kategori, users RESTART IDENTITY CASCADE;` lalu `npm run seed`. |

> Catatan lama: file `backend/data/rasaatlas.db` (SQLite) sudah tidak dipakai dan
> diabaikan Git. Jangan deploy file itu.
