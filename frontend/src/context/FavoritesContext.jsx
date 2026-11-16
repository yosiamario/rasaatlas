import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'
import { queueOfflineAction } from '../lib/offlineQueue'

const LOCAL_FAVS_KEY = 'rasaatlas.local_favorites'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Load favorites from local storage initially
  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_FAVS_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  }

  const saveLocal = (set) => {
    try {
      localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify([...set]))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)

    if (!user) {
      setFavorites(loadLocal())
      setLoading(false)
      return
    }

    // Ambil dari server
    api
      .favorit()
      .then((res) => {
        if (!alive) return
        const ids = new Set((res.data || []).map((t) => t.id))
        // Gabungkan dengan lokal bila ada
        const local = loadLocal()
        local.forEach((id) => ids.add(id))
        setFavorites(ids)
        saveLocal(ids)
      })
      .catch(() => {
        if (alive) setFavorites(loadLocal())
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [user?.id])

  const isFavorite = useCallback((tempatId) => favorites.has(Number(tempatId)), [favorites])

  const toggleFavorite = useCallback(
    async (tempat) => {
      const id = Number(tempat.id)
      const next = new Set(favorites)
      const willAdd = !next.has(id)

      if (willAdd) {
        next.add(id)
      } else {
        next.delete(id)
      }

      setFavorites(next)
      saveLocal(next)

      if (!navigator.onLine) {
        queueOfflineAction({
          type: willAdd ? 'add_favorit' : 'remove_favorit',
          id_target: id,
          payload: { nama: tempat.nama },
        })
        return willAdd
      }

      if (user) {
        try {
          if (willAdd) {
            await api.addFavorit(id)
          } else {
            await api.removeFavorit(id)
          }
        } catch (err) {
          console.warn('[favorites] sinkronisasi server gagal, simpan antrean:', err)
          queueOfflineAction({
            type: willAdd ? 'add_favorit' : 'remove_favorit',
            id_target: id,
          })
        }
      }

      return willAdd
    },
    [favorites, user],
  )

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

