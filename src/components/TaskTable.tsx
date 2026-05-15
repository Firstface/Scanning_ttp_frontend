import { Link } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'
import { formatDateTime } from '../lib/utils'
import type { SampleTaskRecord } from '../lib/types'

interface TaskTableProps {
  tasks: SampleTaskRecord[]
}

export function TaskTable({ tasks }: TaskTableProps) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>taskId</th>
            <th>databaseName</th>
            <th>tableName</th>
            <th>targetSampleRows</th>
            <th>sampledRows</th>
            <th>parent status</th>
            <th>createdAt</th>
            <th>updatedAt</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.taskId}>
              <td className="mono-cell">{task.taskId}</td>
              <td>{task.databaseName}</td>
              <td>{task.tableName}</td>
              <td>{task.targetSampleRows}</td>
              <td>{task.sampledRows}</td>
              <td>
                <StatusBadge status={task.parentStatus} />
              </td>
              <td>{formatDateTime(task.createdAt)}</td>
              <td>{formatDateTime(task.updatedAt)}</td>
              <td>
                <Link className="text-link" to={`/tasks/${task.taskId}`}>
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
