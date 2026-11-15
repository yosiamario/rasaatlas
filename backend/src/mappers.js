/**
 * Ubah baris SQLite menjadi objek JSON yang rapi untuk frontend.
 * Semua field opsional diberi nilai default "Tidak diketahui" agar UI
 * tidak pernah menampilkan undefined.
 */
export function mapTempat(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    nama: row.nama || 'Tidak diketahui',
    kategori_id: row.kategori_id,
    kategori: row.kategori || 'Tidak diketahui',
    kategori_slug: row.kategori_slug || 'lainnya',
    kategori_ikon: row.kategori_ikon || '🍽️',
    alamat: row.alamat || 'Tidak diketahui',
    harga: Number(row.harga) || 0,
    rating: Number(row.rating) || 0,
    deskripsi: row.deskripsi || 'Belum ada deskripsi.',
    foto_url: row.foto_url || '',
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    jam_buka: row.jam_buka || 'Tidak diketahui',
    populer: Boolean(row.populer),
    osm_id: row.osm_id || null,
  }
}

export function mapKategori(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    nama: row.nama || 'Tidak diketahui',
    ikon: row.ikon || '🍽️',
    deskripsi: row.deskripsi || '',
    jumlah_tempat: Number(row.jumlah_tempat) || 0,
    foto_sampel: row.foto_sampel || '',
  }
}

export function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    nama: row.nama || 'Tidak diketahui',
    email: row.email,
    nim: row.nim || '',
    bio: row.bio || '',
    dibuat_pada: row.created_at,
  }
}
