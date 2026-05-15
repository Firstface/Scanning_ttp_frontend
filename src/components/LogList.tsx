import { formatDateTime } from '../lib/utils'
import type { TaskLogItem } from '../lib/types'

interface LogListProps {
  logs: TaskLogItem[]
}

export function LogList({ logs }: LogListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Task Logs</p>
          <h2>Log List</h2>
        </div>
      </div>

      <div className="log-list">
        {logs.length === 0 ? (
          <div className="log-item empty-cell">No logs available</div>
        ) : (
          logs.map((log) => (
            <article key={log.id} className={`log-item log-${log.level.toLowerCase()}`}>
              <div className="log-meta">
                <span className="log-level">{log.level}</span>
                <span>{formatDateTime(log.timestamp)}</span>
              </div>
              <p>{log.message}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
