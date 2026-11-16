import { createContext, useContext, useEffect, useState } from 'react'

const DICTIONARY = {
  id: {
    // Navigation
    nav_beranda: 'Beranda',
    nav_tempat: 'Tempat',
    nav_kategori: 'Kategori',
    nav_profil: 'Profil',
    nav_favorit: 'Favorit',
    nav_tambah: 'Tambah',
    nav_masuk: 'Masuk',
    nav_keluar: 'Keluar',
    nav_kontribusi: 'Kontribusi Saya',
    nav_moderasi: 'Moderasi Admin',

    // General
    loading: 'Memuat…',
    batal: 'Batal',
    simpan: 'Simpan',
    hapus: 'Hapus',
    kembali: 'Kembali',
    bagikan: 'Bagikan',
    tersalin: 'Tersalin',
    rute: 'Rute',
    cari: 'Cari',
    semua: 'Semua',
    baru: 'Baru',
    offline_mode: 'Mode Offline',
    offline_msg: 'Aksi Anda disimpan dan akan disinkronkan saat terhubung internet.',

    // Tempat list & filter
    katalog_judul: 'Semua tempat',
    katalog_deskripsi: 'Saring berdasarkan kategori, cari nama tempat, atau urutkan sesuai selera.',
    urut_populer: 'Paling populer',
    urut_rating: 'Rating tertinggi',
    urut_termurah: 'Harga termurah',
    urut_tertinggi: 'Harga tertinggi',
    urut_nama: 'Nama A–Z',
    urut_terdekat: 'Paling dekat dengan saya',
    filter_rating: 'Rating minimum',
    filter_harga: 'Harga maksimum',
    buka_sekarang: 'Buka sekarang saja',
    tampilan_grid: 'Tampilan Grid',
    tampilan_peta: 'Tampilan Peta',
    gunakan_lokasi: 'Gunakan lokasi saya',
    muat_lebih_banyak: 'Muat lebih banyak tempat',

    // Status
    buka: 'Buka Sekarang',
    tutup: 'Sedang Tutup',
    status_pending: 'Menunggu Moderasi',
    status_approved: 'Disetujui',
    status_rejected: 'Ditolak',

    // Review & Favorite
    ulasan_judul: 'Ulasan & Rating Pengguna',
    tulis_ulasan: 'Beri Ulasan',
    rating_anda: 'Rating Anda',
    komentar_placeholder: 'Ceritakan pengalaman rasa, porsi, atau suasana di sini…',
    kirim_ulasan: 'Kirim Ulasan',
    belum_ada_ulasan: 'Belum ada ulasan dari pengguna. Jadilah yang pertama memberikan ulasan!',
    simpan_favorit: 'Simpan ke Favorit',
    hapus_favorit: 'Hapus dari Favorit',

    // Profile & Settings
    pengaturan: 'Pengaturan & Tampilan',
    tema_gelap: 'Mode Gelap',
    bahasa: 'Bahasa',
    ganti_password: 'Ganti Password',
    hapus_akun: 'Hapus Akun',
  },
  en: {
    // Navigation
    nav_beranda: 'Home',
    nav_tempat: 'Places',
    nav_kategori: 'Categories',
    nav_profil: 'Profile',
    nav_favorit: 'Favorites',
    nav_tambah: 'Add Place',
    nav_masuk: 'Sign In',
    nav_keluar: 'Sign Out',
    nav_kontribusi: 'My Contributions',
    nav_moderasi: 'Admin Moderation',

    // General
    loading: 'Loading…',
    batal: 'Cancel',
    simpan: 'Save',
    hapus: 'Delete',
    kembali: 'Back',
    bagikan: 'Share',
    tersalin: 'Copied',
    rute: 'Directions',
    cari: 'Search',
    semua: 'All',
    baru: 'New',
    offline_mode: 'Offline Mode',
    offline_msg: 'Your action was saved and will be synced once back online.',

    // Tempat list & filter
    katalog_judul: 'All Culinary Places',
    katalog_deskripsi: 'Filter by category, search by name, or sort to your taste.',
    urut_populer: 'Most Popular',
    urut_rating: 'Highest Rating',
    urut_termurah: 'Lowest Price',
    urut_tertinggi: 'Highest Price',
    urut_nama: 'Name A–Z',
    urut_terdekat: 'Nearest to Me',
    filter_rating: 'Minimum rating',
    filter_harga: 'Maximum price',
    buka_sekarang: 'Open now only',
    tampilan_grid: 'Grid View',
    tampilan_peta: 'Map View',
    gunakan_lokasi: 'Use my current location',
    muat_lebih_banyak: 'Load more places',

    // Status
    buka: 'Open Now',
    tutup: 'Closed',
    status_pending: 'Pending Moderation',
    status_approved: 'Approved',
    status_rejected: 'Rejected',

    // Review & Favorite
    ulasan_judul: 'User Reviews & Ratings',
    tulis_ulasan: 'Write a Review',
    rating_anda: 'Your Rating',
    komentar_placeholder: 'Share your taste, portion, or vibe experience here…',
    kirim_ulasan: 'Submit Review',
    belum_ada_ulasan: 'No reviews yet. Be the first to share your experience!',
    simpan_favorit: 'Save to Favorites',
    hapus_favorit: 'Remove from Favorites',

    // Profile & Settings
    pengaturan: 'Settings & Appearance',
    tema_gelap: 'Dark Mode',
    bahasa: 'Language',
    ganti_password: 'Change Password',
    hapus_akun: 'Delete Account',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('rasaatlas.lang')
      return saved === 'en' ? 'en' : 'id'
    } catch {
      return 'id'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('rasaatlas.lang', lang)
      document.documentElement.lang = lang
    } catch {
      /* ignore */
    }
  }, [lang])

  const t = (key, fallback = '') => {
    return DICTIONARY[lang]?.[key] || DICTIONARY.id[key] || fallback || key
  }

  const toggleLang = () => {
    setLang((prev) => (prev === 'id' ? 'en' : 'id'))
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}

