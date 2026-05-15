import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSampleTask,
  getSampleTaskLogs,
  getSampleTaskPipeline,
  getSampleTaskShards,
} from '../api/sampleTasks'
import { LogList } from '../components/LogList'
import { PipelineFlow } from '../components/PipelineFlow'
import { ResultSummaryCard } from '../components/ResultSummaryCard'
import { ShardTable } from '../components/ShardTable'
import { StatusBadge } from '../components/StatusBadge'
import {
  extendPipelineLifecycle,
  getTaskQualifiedName,
  isTerminalStatus,
  summarizeShards,
} from '../lib/utils'
import type {
  SampleTaskDetail,
  ShardRecord,
  TaskLogItem,
  TaskPipelineResponse,
} from '../lib/types'

export function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const [task, setTask] = useState<SampleTaskDetail | null>(null)
  const [pipeline, setPipeline] = useState<TaskPipelineResponse | null>(null)
  const [shards, setShards] = useState<ShardRecord[]>([])
  const [logs, setLogs] = useState<TaskLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    let timerId: number | undefined

    async function loadAll() {
      try {
        const [taskResult, pipelineResult, shardResult, logResult] = await Promise.all([
          getSampleTask(taskId),
          getSampleTaskPipeline(taskId),
          getSampleTaskShards(taskId),
          getSampleTaskLogs(taskId),
        ])

        if (disposed) {
          return
        }

        setTask(taskResult)
        setPipeline({
          ...pipelineResult,
          parentStatus: taskResult.parentStatus,
        })
        setShards(shardResult)
        setLogs(logResult)
        setError('')

        if (!isTerminalStatus(taskResult.parentStatus)) {
          timerId = window.setTimeout(() => {
            void loadAll()
          }, 1000)
        }
      } catch (loadError) {
        if (!disposed) {
          const message = loadError instanceof Error ? loadError.message : 'Failed to load task details'
          setError(message)
        }
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    void loadAll()

    return () => {
      disposed = true
      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [taskId])

  const shardSummary = useMemo(() => summarizeShards(shards), [shards])
  const lifecyclePipeline = useMemo(() => {
    if (!task || !pipeline) {
      return null
    }

    return extendPipelineLifecycle(pipeline, task, shards, logs)
  }, [logs, pipeline, shards, task])

  if (loading) {
    return <div className="loading-state">Loading task details...</div>
  }

  if (error) {
    return (
      <div className="page-stack">
        <section className="panel">
          <h2>Failed to Load Task Details</h2>
          <p className="error-text">{error}</p>
          <Link className="text-link" to="/records">
            Back to Task Records
          </Link>
        </section>
      </div>
    )
  }

  if (!task || !pipeline || !lifecyclePipeline) {
    return null
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Task Detail</p>
          <h2>Sampling Task Detail</h2>
          <p className="muted">
            Monitor the parent task status, pipeline progress, shard processing results, and runtime logs in real time.
          </p>
        </div>
        <Link className="secondary-button as-link" to="/records">
          Back to Task Records
        </Link>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task Overview</p>
            <h2>Parent Task Overview</h2>
          </div>
          <StatusBadge status={task.parentStatus} />
        </div>

        <div className="summary-grid">
          <OverviewItem label="taskId" value={task.taskId} mono />
          <OverviewItem label="database.table" value={getTaskQualifiedName(task)} />
          <OverviewItem label="targetSampleRows" value={`${task.targetSampleRows}`} />
          <OverviewItem label="sampledRows" value={`${task.sampledRows}`} />
          <OverviewItem label="Parent Status" value={<StatusBadge status={task.parentStatus} />} />
        </div>
      </section>

      <ResultSummaryCard
        finalStatus={task.parentStatus}
        targetSampleRows={task.targetSampleRows}
        sampledRows={task.sampledRows}
        shardTotal={shardSummary.total}
        shardSuccess={shardSummary.success}
        shardFailed={shardSummary.failed}
        shardCancelled={shardSummary.cancelled}
      />

      <PipelineFlow parentStatus={lifecyclePipeline.parentStatus} executors={lifecyclePipeline.executors} />
      <ShardTable shards={shards} />
      <LogList logs={logs} />
    </div>
  )
}

interface OverviewItemProps {
  label: string
  value: ReactNode
  mono?: boolean
}

function OverviewItem({ label, value, mono = false }: OverviewItemProps) {
  return (
    <div className="summary-item">
      <span className="summary-label">{label}</span>
      <div className={`summary-value${mono ? ' mono-cell' : ''}`}>{value}</div>
    </div>
  )
}
