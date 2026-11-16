/**
 * Utility untuk menghitung status operasional tempat kuliner berdasarkan
 * string jam buka dan waktu lokal saat ini (WIB / GMT+7).
 */

/**
 * Parsing waktu string seperti "08.00", "08:00", "8.30", "21.00" ke menit dari tengah malam (0..1439)
 */
function waktuKeMenit(waktuStr) {
  if (!waktuStr) return null
  const bersih = waktuStr.trim().replace(':', '.')
  const match = bersih.match(/^(\d{1,2})(?:\.(\d{1,2}))?$/)
  if (!match) return null
  const jam = parseInt(match[1], 10)
  const menit = match[2] ? parseInt(match[2], 10) : 0
  if (jam < 0 || jam > 24 || menit < 0 || menit > 59) return null
  return jam * 60 + menit
}

/**
 * Evaluasi status buka tempat berdasarkan teks jam_buka
 * @param {string} jamBuka - contoh: "08.00–21.00", "24 jam", "10.00 - 22.00", "Tutup"
 * @param {Date} [waktuUji] - tanggal/jam opsional untuk pengujian
 * @returns {{ isOpen: boolean, label: string, statusClass: 'open' | 'closed' | 'unknown', note: string }}
 */
export function cekStatusBuka(jamBuka, waktuUji = null) {
  if (!jamBuka || jamBuka.toLowerCase() === 'tidak diketahui') {
    return {
      isOpen: false,
      label: 'Jam buka tidak diketahui',
      statusClass: 'unknown',
      note: 'Tidak ada informasi jam buka.',
    }
  }

  const teks = jamBuka.trim().toLowerCase()

  if (teks.includes('24 jam') || teks.includes('24 hours')) {
    return {
      isOpen: true,
      label: 'Buka 24 Jam',
      statusClass: 'open',
      note: 'Selalu buka 24 jam.',
    }
  }

  if (teks.includes('tutup sementara') || teks === 'tutup') {
    return {
      isOpen: false,
      label: 'Sedang Tutup',
      statusClass: 'closed',
      note: 'Tutup sementara.',
    }
  }

  // Waktu saat ini (default: waktu lokal pengguna / WIB)
  const now = waktuUji || new Date()
  const sekarangMenit = now.getHours() * 60 + now.getMinutes()

  // Pola rentang jam: e.g. "08.00–21.00", "08:00 - 21:00", "07.00 - 15.00"
  // Mendukung pemisah strip (-), en-dash (–), em-dash (—), spasi
  const rentangMatch = teks.match(/(\d{1,2}(?:[.:]\d{2})?)\s*[-–—]\s*(\d{1,2}(?:[.:]\d{2})?)/)
  if (!rentangMatch) {
    return {
      isOpen: true,
      label: 'Jam operasional khusus',
      statusClass: 'unknown',
      note: jamBuka,
    }
  }

  const bukaMenit = waktuKeMenit(rentangMatch[1])
  const tutupMenit = waktuKeMenit(rentangMatch[2])

  if (bukaMenit === null || tutupMenit === null) {
    return {
      isOpen: true,
      label: 'Buka',
      statusClass: 'unknown',
      note: jamBuka,
    }
  }

  // Kasus 1: Tutup di hari yang sama (misal 08.00 s.d 21.00)
  if (tutupMenit > bukaMenit) {
    if (sekarangMenit >= bukaMenit && sekarangMenit < tutupMenit) {
      return {
        isOpen: true,
        label: 'Buka Sekarang',
        statusClass: 'open',
        note: `Tutup pukul ${rentangMatch[2].replace(':', '.')}`,
      }
    }
    return {
      isOpen: false,
      label: 'Sedang Tutup',
      statusClass: 'closed',
      note: `Buka pukul ${rentangMatch[1].replace(':', '.')}`,
    }
  }

  // Kasus 2: Tutup lewat tengah malam (misal 17.00 s.d 02.00 pagi)
  if (sekarangMenit >= bukaMenit || sekarangMenit < tutupMenit) {
    return {
      isOpen: true,
      label: 'Buka Sekarang',
      statusClass: 'open',
      note: `Tutup pukul ${rentangMatch[2].replace(':', '.')}`,
    }
  }

  return {
    isOpen: false,
    label: 'Sedang Tutup',
    statusClass: 'closed',
    note: `Buka pukul ${rentangMatch[1].replace(':', '.')}`,
  }
}

