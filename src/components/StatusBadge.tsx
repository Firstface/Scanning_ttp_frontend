import type { ExecutorViewStatus, ParentTaskStatus, ShardStatus } from '../lib/types'

type BadgeStatus = ParentTaskStatus | ExecutorViewStatus | ShardStatus

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${toStatusClass(status)}`}>{status}</span>
}

function toStatusClass(status: BadgeStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'is-success'
    case 'FAILED':
      return 'is-failed'
    case 'RUNNING':
    case 'PIPELINE_RUNNING':
      return 'is-running'
    case 'DISPATCHED':
      return 'is-dispatched'
    case 'CREATED':
    case 'PENDING':
      return 'is-pending'
    case 'CANCELLED':
      return 'is-cancelled'
    default:
      return 'is-pending'
  }
}
