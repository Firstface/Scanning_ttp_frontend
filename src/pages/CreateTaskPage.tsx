import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSampleTask } from '../api/sampleTasks'
import { DATABASE_OPTIONS } from '../lib/constants'

export function CreateTaskPage() {
  const navigate = useNavigate()
  const [databaseName, setDatabaseName] = useState(DATABASE_OPTIONS[0]?.databaseName ?? '')
  const [tableName, setTableName] = useState(DATABASE_OPTIONS[0]?.tables[0]?.tableName ?? '')
  const [targetSampleRows, setTargetSampleRows] = useState(2500)
  const [selectedPartitions, setSelectedPartitions] = useState<string[]>(
    DATABASE_OPTIONS[0]?.tables[0]?.partitions.slice(0, 2) ?? [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const database = useMemo(
    () => DATABASE_OPTIONS.find((item) => item.databaseName === databaseName) ?? DATABASE_OPTIONS[0],
    [databaseName],
  )

  const tables = database?.tables ?? []
  const table = tables.find((item) => item.tableName === tableName) ?? tables[0]
  const partitions = table?.partitions ?? []

  function handleDatabaseChange(nextDatabaseName: string) {
    setDatabaseName(nextDatabaseName)
    const nextDatabase = DATABASE_OPTIONS.find((item) => item.databaseName === nextDatabaseName)
    const nextTable = nextDatabase?.tables[0]
    setTableName(nextTable?.tableName ?? '')
    setSelectedPartitions(nextTable?.partitions.slice(0, 2) ?? [])
  }

  function handleTableChange(nextTableName: string) {
    setTableName(nextTableName)
    const nextTable = tables.find((item) => item.tableName === nextTableName)
    setSelectedPartitions(nextTable?.partitions.slice(0, 2) ?? [])
  }

  function togglePartition(partition: string) {
    setSelectedPartitions((current) =>
      current.includes(partition)
        ? current.filter((item) => item !== partition)
        : [...current, partition],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const result = await createSampleTask({
        databaseName,
        tableName,
        targetSampleRows,
        selectedPartitions,
      })
      navigate(`/tasks/${result.taskId}`)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create task'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Create Sample Task</p>
          <h2>Create Sampling Task</h2>
          <p className="muted">
            Choose the source table, target row count, and partitions, then open the task detail page to track progress.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task Form</p>
            <h2>Create a Hive Sampling Task</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Database</span>
            <select value={databaseName} onChange={(event) => handleDatabaseChange(event.target.value)}>
              {DATABASE_OPTIONS.map((item) => (
                <option key={item.databaseName} value={item.databaseName}>
                  {item.databaseName}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Table</span>
            <select value={tableName} onChange={(event) => handleTableChange(event.target.value)}>
              {tables.map((item) => (
                <option key={item.tableName} value={item.tableName}>
                  {item.tableName}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>targetSampleRows</span>
            <input
              type="number"
              min={1}
              value={targetSampleRows}
              onChange={(event) => setTargetSampleRows(Number(event.target.value))}
            />
          </label>

          <div className="form-field form-field-full">
            <span>selectedPartitions</span>
            <div className="tag-grid">
              {partitions.map((partition) => (
                <button
                  key={partition}
                  type="button"
                  className={`tag-toggle${selectedPartitions.includes(partition) ? ' active' : ''}`}
                  onClick={() => togglePartition(partition)}
                >
                  {partition}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={submitting || selectedPartitions.length === 0}>
              {submitting ? 'Creating...' : 'Create Task and Open Details'}
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('/records')}>
              View Task Records
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>
    </div>
  )
}
