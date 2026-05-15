import type { ReactNode } from 'react'
import { StatusBadge } from './StatusBadge'
import type { ParentTaskStatus } from '../lib/types'

interface ResultSummaryCardProps {
  finalStatus: ParentTaskStatus
  targetSampleRows: number
  sampledRows: number
  shardTotal: number
  shardSuccess: number
  shardFailed: number
  shardCancelled: number
}

export function ResultSummaryCard(props: ResultSummaryCardProps) {
  const reachedTarget = props.sampledRows >= props.targetSampleRows

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Result Summary</p>
          <h2>Sampling Result</h2>
        </div>
        <StatusBadge status={props.finalStatus} />
      </div>

      <div className="summary-grid">
        <SummaryItem label="Final Status" value={<StatusBadge status={props.finalStatus} />} />
        <SummaryItem label="Sampled Rows" value={`${props.sampledRows} / ${props.targetSampleRows}`} />
        <SummaryItem label="Target Reached" value={reachedTarget ? 'Yes' : 'No'} />
        <SummaryItem label="Total Shards" value={`${props.shardTotal}`} />
        <SummaryItem label="Successful Shards" value={`${props.shardSuccess}`} />
        <SummaryItem label="Failed Shards" value={`${props.shardFailed}`} />
        <SummaryItem label="Cancelled Shards" value={`${props.shardCancelled}`} />
      </div>
    </section>
  )
}

interface SummaryItemProps {
  label: string
  value: ReactNode
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="summary-item">
      <span className="summary-label">{label}</span>
      <div className="summary-value">{value}</div>
    </div>
  )
}
