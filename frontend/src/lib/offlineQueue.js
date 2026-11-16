/**
 * Antrean Aksi Tulis Offline untuk PWA RasaAtlas.
 * Menyimpan aksi seperti penambahan tempat, pengeditan, ulasan, atau favorit
 * saat pengguna sedang tidak terhubung ke internet, dan otomatis menyinkronkan
 * ke server saat jaringan kembali tersedia.
 */

const STORAGE_KEY = 'rasaatlas.offline_queue'

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error('[offlineQueue] gagal menyimpan antrean:', err)
  }
}

export function queueOfflineAction(action) {
  const queue = getOfflineQueue()
  const item = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...action,
  }
  queue.push(item)
  saveOfflineQueue(queue)
  window.dispatchEvent(new CustomEvent('rasaatlas:offline-queue-changed', { detail: { count: queue.length } }))
  return item
}

export function removeOfflineAction(id) {
  const queue = getOfflineQueue().filter((item) => item.id !== id)
  saveOfflineQueue(queue)
  window.dispatchEvent(new CustomEvent('rasaatlas:offline-queue-changed', { detail: { count: queue.length } }))
}

/**
 * Proses antrean saat perangkat online kembali
 */
export async function processOfflineQueue(api) {
  const queue = getOfflineQueue()
  if (!queue.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0
  const remaining = []

  for (const item of queue) {
    try {
      if (item.type === 'create_tempat') {
        await api.createTempat(item.payload)
      } else if (item.type === 'update_tempat') {
        await api.updateTempat(item.id_target, item.payload)
      } else if (item.type === 'create_ulasan') {
        await api.createUlasan(item.id_target, item.payload)
      } else if (item.type === 'add_favorit') {
        await api.addFavorit(item.id_target)
      } else if (item.type === 'remove_favorit') {
        await api.removeFavorit(item.id_target)
      }
      processed += 1
    } catch (err) {
      console.warn(`[offlineQueue] gagal memproses aksi ${item.type}:`, err)
      // Simpan kembali jika gagal karena error jaringan
      if (err.code === 'NETWORK' || !navigator.onLine) {
        remaining.push(item)
      } else {
        // Gagal permanen (validasi, dsb), buang dari antrean
        failed += 1
      }
    }
  }

  saveOfflineQueue(remaining)
  window.dispatchEvent(
    new CustomEvent('rasaatlas:offline-synced', {
      detail: { processed, remaining: remaining.length, failed },
    }),
  )

  return { processed, remaining: remaining.length, failed }
}

