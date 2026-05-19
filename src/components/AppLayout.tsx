import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const navItems = [
  { to: '/create', label: 'Create Task' },
  { to: '/records', label: 'Task Records' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { logout, username } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Sample Task Console</p>
          <h1>Hive Table Sampling Platform</h1>
          <p className="muted">
            Create sampling tasks, track execution lifecycle, and review shard results and logs.
          </p>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="tip-card">
          <p className="tip-title">Signed In</p>
          <p className="muted">Current user: {username || 'admin'}</p>
          <button className="secondary-button nav-logout" type="button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  )
}
