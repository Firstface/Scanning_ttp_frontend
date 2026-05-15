import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/create', label: 'Create Task' },
  { to: '/records', label: 'Task Records' },
]

export function AppLayout() {
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
          <p className="tip-title">Views</p>
          <p className="muted">Review task records, pipeline progress, shard results, and logs in one place.</p>
        </div>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  )
}
