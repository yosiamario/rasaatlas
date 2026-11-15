import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    const token = getToken()

    if (!token) {
      setReady(true)
      return
    }

    api
      .me()
      .then((data) => {
        if (alive) setUser(data.user)
      })
      .catch((err) => {
        // Token kedaluwarsa/tidak valid → bersihkan sesi.
        if (alive && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (alive) setReady(true)
      })

    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await api.register(payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (patch) => {
    const data = await api.updateMe(patch)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout, updateProfile }),
    [user, ready, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
