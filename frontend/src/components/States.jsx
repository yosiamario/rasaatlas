import { AlertTriangle, Inbox, RotateCcw, WifiOff } from 'lucide-react'

export function EmptyState({ title = 'Belum ada data', description, action }) {
  return (
    <div className="state-block">
      <span className="state-icon" aria-hidden="true">
        <Inbox />
      </span>
      <h3>{title}</h3>
      <p>{description || 'Coba ubah kata kunci atau filter yang kamu pilih.'}</p>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry, title = 'Gagal memuat data' }) {
  const offline = error?.code === 'NETWORK'
  return (
    <div className="state-block error" role="alert">
      <span className="state-icon" aria-hidden="true">
        {offline ? <WifiOff /> : <AlertTriangle />}
      </span>
      <h3>{offline ? 'Sepertinya kamu sedang offline' : title}</h3>
      <p>
        {error?.message ||
          'Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman ini.'}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  )
}
