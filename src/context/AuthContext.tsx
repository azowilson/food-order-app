import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken } from '../api/client'
import type { AppData, User } from '../types'

interface AuthContextValue {
  user: User | null
  appData: AppData | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  register: (
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<string | null>
  logout: () => void
  setAppData: (data: AppData) => void
  setUser: (user: User) => void
  refreshAppData: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appData, setAppData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAppData = useCallback(async () => {
    const data = await api.me()
    setUser(data.user)
    setAppData(data.appData)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    refreshAppData()
      .catch(() => {
        setToken(null)
        setUser(null)
        setAppData(null)
      })
      .finally(() => setLoading(false))
  }, [refreshAppData])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = api.parseAuthResponse(await api.login(username, password))
      setToken(data.token)
      setUser(data.user)
      setAppData(data.appData)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Login failed'
    }
  }, [])

  const register = useCallback(
    async (username: string, password: string, displayName?: string) => {
      try {
        const data = api.parseAuthResponse(await api.register(username, password, displayName))
        setToken(data.token)
        setUser(data.user)
        setAppData(data.appData)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'Registration failed'
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setAppData(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      appData,
      loading,
      login,
      register,
      logout,
      setAppData,
      setUser,
      refreshAppData,
    }),
    [user, appData, loading, login, register, logout, refreshAppData],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
