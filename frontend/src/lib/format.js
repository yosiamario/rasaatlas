const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const angka = new Intl.NumberFormat('id-ID')

export function formatRupiah(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Tidak diketahui'
  return rupiah.format(n)
}

export function formatHargaSingkat(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Tidak diketahui'
  if (n >= 1000) return `Rp ${angka.format(Math.round(n / 1000))} rb`
  return `Rp ${angka.format(n)}`
}

export function formatRating(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Belum ada'
  return n.toFixed(1).replace('.', ',')
}

export function inisial(nama = '') {
  return (
    nama
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata[0]?.toUpperCase() || '')
      .join('') || 'R'
  )
}

export function tanggalPanjang(iso) {
  if (!iso) return null
  const date = new Date(String(iso).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
