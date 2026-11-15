import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/** Toast kecil saat service worker menemukan versi baru. */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div className="update-toast" role="status">
      <span>Versi baru RasaAtlas tersedia.</span>
      <button type="button" className="btn btn-accent btn-sm" onClick={() => updateServiceWorker(true)}>
        <RefreshCw aria-hidden="true" />
        Muat ulang
      </button>
    </div>
  )
}
