import { WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="offline-banner" role="status">
      <WifiOff aria-hidden="true" />
      Mode offline — menampilkan data tersimpan
    </div>
  )
}
