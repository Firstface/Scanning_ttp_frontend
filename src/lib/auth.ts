import { API_BASE_URL } from './constants'

const AUTH_TOKEN_KEY = 'auth-token'
const AUTH_USERNAME_KEY = 'auth-username'
const AUTH_EVENT_NAME = 'auth-state-changed'

interface LoginResponse {
  token?: string
}

export function getAuthToken(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
}

export function getAuthUsername(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(AUTH_USERNAME_KEY) ?? ''
}

export function isAuthenticated(): boolean {
  return getAuthToken().trim().length > 0
}

export async function loginWithPassword(username: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = (await response.json().catch(() => ({}))) as LoginResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Login failed')
  }

  if (!data.token) {
    throw new Error('Login response did not include a token')
  }

  saveAuth(data.token, username)
}

export function saveAuth(token: string, username: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  window.localStorage.setItem(AUTH_USERNAME_KEY, username)
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function clearAuth() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USERNAME_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function subscribeAuthChange(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(AUTH_EVENT_NAME, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, listener)
    window.removeEventListener('storage', listener)
  }
}
