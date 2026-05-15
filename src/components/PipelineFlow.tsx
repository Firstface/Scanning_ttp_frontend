import { StatusBadge } from './StatusBadge'
import { formatDateTime } from '../lib/utils'
import type { ParentTaskStatus, PipelineExecutorResult } from '../lib/types'

interface PipelineFlowProps {
  parentStatus: ParentTaskStatus
  executors: PipelineExecutorResult[]
}

export function PipelineFlow({ parentStatus, executors }: PipelineFlowProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Executor Pipeline</p>
          <h2>Execution Pipeline</h2>
        </div>
        <div className="pipeline-end">
          <span className="muted">Final Result</span>
          <StatusBadge status={parentStatus} />
        </div>
      </div>

      <div className="pipeline-stage-bar">
        {executors.map((executor, index) => (
          <div key={executor.executorName} className={`pipeline-stage-chip ${statusClass(executor.status)}`}>
            <span className={`pipeline-status-icon ${iconClass(executor.status)}`} aria-hidden="true">
              {statusSymbol(executor.status)}
            </span>
            <span className="pipeline-stage-step">Step {index + 1}</span>
            <span className="pipeline-stage-name">{executor.executorName}</span>
            {index < executors.length - 1 ? <span className="pipeline-stage-arrow">→</span> : null}
          </div>
        ))}
        <div className={`pipeline-stage-chip pipeline-stage-result ${statusClass(parentStatus)}`}>
          <span className={`pipeline-status-icon ${iconClass(parentStatus)}`} aria-hidden="true">
            {statusSymbol(parentStatus)}
          </span>
          <span className="pipeline-stage-step">Result</span>
          <StatusBadge status={parentStatus} />
        </div>
      </div>

      <div className="pipeline-stage-list">
        {executors.map((executor, index) => (
          <article key={executor.executorName} className={`pipeline-stage-row ${statusClass(executor.status)}`}>
            <div className="pipeline-stage-main">
              <span className="pipeline-index">Step {index + 1}</span>
              <span className={`pipeline-status-icon pipeline-status-icon-lg ${iconClass(executor.status)}`} aria-hidden="true">
                {statusSymbol(executor.status)}
              </span>
              <div>
                <h3>{executor.executorName}</h3>
                <p className="muted">{executor.action}</p>
              </div>
            </div>

            <div className="pipeline-stage-meta">
              <div className="pipeline-meta-item">
                <span className="pipeline-meta-label">status</span>
                <StatusBadge status={executor.status} />
              </div>
              <div className="pipeline-meta-item">
                <span className="pipeline-meta-label">success</span>
                <span className="pipeline-meta-value">
                  {executor.success === null ? '-' : String(executor.success)}
                </span>
              </div>
              <div className="pipeline-meta-item pipeline-meta-wide">
                <span className="pipeline-meta-label">outputSummary</span>
                <span className="pipeline-meta-value">{executor.outputSummary}</span>
              </div>
              <div className="pipeline-meta-item">
                <span className="pipeline-meta-label">startedAt</span>
                <span className="pipeline-meta-value">{formatDateTime(executor.startedAt)}</span>
              </div>
              <div className="pipeline-meta-item">
                <span className="pipeline-meta-label">finishedAt</span>
                <span className="pipeline-meta-value">{formatDateTime(executor.finishedAt || executor.executedAt)}</span>
              </div>
              <div className="pipeline-meta-item pipeline-meta-wide">
                <span className="pipeline-meta-label">errorMessage</span>
                <span className={`pipeline-meta-value${executor.errorMessage ? ' is-error' : ''}`}>
                  {executor.errorMessage || '-'}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function statusClass(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'node-success'
    case 'FAILED':
      return 'node-failed'
    case 'RUNNING':
    case 'PIPELINE_RUNNING':
      return 'node-running'
    case 'DISPATCHED':
      return 'node-dispatched'
    default:
      return 'node-pending'
  }
}

function iconClass(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'icon-success'
    case 'FAILED':
      return 'icon-failed'
    case 'RUNNING':
    case 'PIPELINE_RUNNING':
    case 'DISPATCHED':
      return 'icon-running'
    default:
      return 'icon-pending'
  }
}

function statusSymbol(status: string) {
  switch (status) {
    case 'SUCCESS':
      return '✓'
    case 'FAILED':
      return '✕'
    case 'RUNNING':
    case 'PIPELINE_RUNNING':
    case 'DISPATCHED':
      return ''
    default:
      return '·'
  }
}
