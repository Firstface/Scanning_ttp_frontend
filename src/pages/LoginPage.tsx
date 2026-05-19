import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'

interface RouteState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setError('')
  }, [username, password])

  if (isAuthenticated) {
    return <Navigate to="/records" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(username, password)
      const nextPath = (location.state as RouteState | null)?.from?.pathname || '/records'
      navigate(nextPath, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-panel">
        <div className="login-header">
          <p className="eyebrow">JWT Sign In</p>
          <h1>Hive Sampling Platform</h1>
          <p className="muted">
            Sign in with the configured demo account to access task creation, task records, and task detail pages.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button login-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>

          {error ? <p className="error-text login-error">{error}</p> : null}
        </form>

        <div className="login-help">
          <span className="summary-label">Default Demo Account</span>
          <div className="login-credentials">
            <span className="mono-cell">admin</span>
            <span className="mono-cell">admin123</span>
          </div>
        </div>
      </section>
    </div>
  )
}
