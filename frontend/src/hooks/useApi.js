import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Pemanggil data sederhana dengan status loading/error dan fungsi reload.
 * `loader` boleh berubah setiap render; yang memicu fetch adalah `deps`.
 */
export function useApi(loader, deps = []) {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState({ data: null, error: null, loading: true })

  useEffect(() => {
    let alive = true
    setState({ data: null, error: null, loading: true })

    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (alive) setState({ data: null, error, loading: false })
      })

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, reload }
}
