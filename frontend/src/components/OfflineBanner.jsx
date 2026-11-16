import { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'
import { api } from '../lib/api'
import { getOfflineQueue, processOfflineQueue } from '../lib/offlineQueue'

export default function OfflineBanner() {
  const online = useOnline()
  const [queueCount, setQueueCount] = useState(() => getOfflineQueue().length)
  const [syncToast, setSyncToast] = useState(null)

  useEffect(() => {
    const handleQueueChange = (e) => {
      setQueueCount(e.detail?.count ?? getOfflineQueue().length)
    }
    const handleSynced = (e) => {
      if (e.detail?.processed > 0) {
        setSyncToast(`${e.detail.processed} aksi offline berhasil disinkronkan ke server.`)
        setTimeout(() => setSyncToast(null), 4000)
      }
    }

    window.addEventListener('rasaatlas:offline-queue-changed', handleQueueChange)
    window.addEventListener('rasaatlas:offline-synced', handleSynced)

    return () => {
      window.removeEventListener('rasaatlas:offline-queue-changed', handleQueueChange)
      window.removeEventListener('rasaatlas:offline-synced', handleSynced)
    }
  }, [])

  useEffect(() => {
    if (online) {
      processOfflineQueue(api).then((res) => {
        setQueueCount(res.remaining)
      })
    }
  }, [online])

  if (syncToast) {
    return (
      <div className="offline-banner synced" role="status">
        <CheckCircle2 aria-hidden="true" />
        {syncToast}
      </div>
    )
  }

  if (!online) {
    return (
      <div className="offline-banner" role="status">
        <WifiOff aria-hidden="true" />
        <span>Mode offline — menampilkan data tersimpan</span>
        {queueCount > 0 && (
          <span className="queue-pill">
            <RefreshCw aria-hidden="true" className="spin-slow" />
            {queueCount} aksi tertunda
          </span>
        )}
      </div>
    )
  }

  return null
}
