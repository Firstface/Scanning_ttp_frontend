import { useEffect, useMemo, useState } from 'react'
import { listSampleTasks } from '../api/sampleTasks'
import { TaskTable } from '../components/TaskTable'
import type { ParentTaskStatus, SampleTaskRecord } from '../lib/types'

const statusOptions: Array<ParentTaskStatus | 'ALL'> = [
  'ALL',
  'CREATED',
  'PIPELINE_RUNNING',
  'DISPATCHED',
  'RUNNING',
  'SUCCESS',
  'FAILED',
]

export function RecordsPage() {
  const [tasks, setTasks] = useState<SampleTaskRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ParentTaskStatus | 'ALL'>('ALL')
  const [databaseFilter, setDatabaseFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')

  useEffect(() => {
    let active = true

    async function loadTasks() {
      setLoading(true)
      try {
        const result = await listSampleTasks()
        if (active) {
          setTasks(result)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTasks()
    return () => {
      active = false
    }
  }, [])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatched = statusFilter === 'ALL' || task.parentStatus === statusFilter
      const databaseMatched =
        databaseFilter.trim() === '' ||
        task.databaseName.toLowerCase().includes(databaseFilter.trim().toLowerCase())
      const tableMatched =
        tableFilter.trim() === '' ||
        task.tableName.toLowerCase().includes(tableFilter.trim().toLowerCase())

      return statusMatched && databaseMatched && tableMatched
    })
  }, [databaseFilter, statusFilter, tableFilter, tasks])

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Sample Task Records</p>
          <h2>Sampling Task Records</h2>
          <p className="muted">
            Browse created tasks, inspect their latest status and sampled rows, and filter quickly by status, database, or table.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Filter Tasks</h2>
          </div>
        </div>

        <div className="filter-grid">
          <label className="form-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ParentTaskStatus | 'ALL')}>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Database</span>
            <input
              type="text"
              placeholder="e.g. dw_app"
              value={databaseFilter}
              onChange={(event) => setDatabaseFilter(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Table</span>
            <input
              type="text"
              placeholder="e.g. user_behavior"
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task List</p>
            <h2>Task History</h2>
          </div>
          <span className="muted">{loading ? 'Loading...' : `${filteredTasks.length} records`}</span>
        </div>

        <TaskTable tasks={filteredTasks} />
      </section>
    </div>
  )
}
