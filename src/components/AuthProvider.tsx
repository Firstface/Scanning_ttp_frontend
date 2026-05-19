import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearAuth,
  getAuthToken,
  getAuthUsername,
  isAuthenticated,
  loginWithPassword,
  subscribeAuthChange,
} from '../lib/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  username: string
  token: string
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getAuthToken())
  const [username, setUsername] = useState(() => getAuthUsername())

  useEffect(() => {
    return subscribeAuthChange(() => {
      setToken(getAuthToken())
      setUsername(getAuthUsername())
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      isAuthenticated: isAuthenticated(),
      username,
      token,
      async login(nextUsername: string, password: string) {
        await loginWithPassword(nextUsername, password)
        setToken(getAuthToken())
        setUsername(getAuthUsername())
      },
      logout() {
        clearAuth()
        setToken('')
        setUsername('')
      },
    }
  }, [token, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
