import { StatusBadge } from './StatusBadge'
import { formatDateTime } from '../lib/utils'
import type { ShardRecord } from '../lib/types'

interface ShardTableProps {
  shards: ShardRecord[]
}

export function ShardTable({ shards }: ShardTableProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Shard Results</p>
          <h2>Shard List</h2>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>shardId</th>
              <th>partition</th>
              <th>status</th>
              <th>sampledRows</th>
              <th>worker</th>
              <th>updatedAt</th>
              <th>message</th>
            </tr>
          </thead>
          <tbody>
            {shards.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  No shard data available
                </td>
              </tr>
            ) : (
              shards.map((shard) => (
                <tr key={shard.shardId}>
                  <td className="mono-cell">{shard.shardId}</td>
                  <td>{shard.partitionName}</td>
                  <td>
                    <StatusBadge status={shard.status} />
                  </td>
                  <td>{shard.sampledRows}</td>
                  <td>{shard.worker || '-'}</td>
                  <td>{formatDateTime(shard.updatedAt)}</td>
                  <td>{shard.message || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
