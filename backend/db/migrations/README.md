# Migrasi database

`src/migrate.js` menjalankan migrasi secara berurutan dan mencatat versi yang
sudah diterapkan di tabel `schema_migrations`.

| Versi | File | Isi |
| --- | --- | --- |
| `001_init` | [`../schema.sql`](../schema.sql) | Skema awal: `users`, `kategori`, `tempat`, indeks, RLS |

## Menambah migrasi baru

1. Buat file bernomor, misalnya `002_tempat_status.sql`.
2. Tulis SQL yang **idempotent** agar aman diulang bila proses terputus:

   ```sql
   ALTER TABLE tempat ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktif';
   CREATE INDEX IF NOT EXISTS idx_tempat_status ON tempat (status);
   ```

3. Jalankan `npm run migrate` dari folder `backend`.

Server juga menjalankan migrasi otomatis saat start (`ensureSchema`), jadi
deploy berikutnya tidak perlu langkah manual. Jangan mengubah file migrasi yang
sudah pernah diterapkan — buat file baru.
