import { useCallback, useEffect, useState } from 'react'

const standalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(standalone)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !window.MSStream)

    const onPrompt = (event) => {
      event.preventDefault()
      setDeferred(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable'
    deferred.prompt()
    const result = await deferred.userChoice
    setDeferred(null)
    if (result.outcome === 'accepted') setInstalled(true)
    return result.outcome
  }, [deferred])

  return { canInstall: Boolean(deferred), installed, isIOS, promptInstall }
}
