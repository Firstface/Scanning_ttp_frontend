import type {
  PipelineExecutorResult,
  SampleTaskRecord,
  ShardRecord,
  TaskLogItem,
  TaskPipelineResponse,
} from '../lib/types'

const now = new Date('2026-05-14T10:35:00Z')

function minutesAgo(minutes: number) {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString()
}

export const mockTaskRecords: SampleTaskRecord[] = [
  {
    taskId: 'task-20260514-001',
    databaseName: 'dw_app',
    tableName: 'user_behavior_di',
    targetSampleRows: 2500,
    sampledRows: 2709,
    parentStatus: 'SUCCESS',
    createdAt: minutesAgo(50),
    updatedAt: minutesAgo(36),
  },
  {
    taskId: 'task-20260514-002',
    databaseName: 'dw_trade',
    tableName: 'order_snapshot_di',
    targetSampleRows: 1200,
    sampledRows: 900,
    parentStatus: 'RUNNING',
    createdAt: minutesAgo(30),
    updatedAt: minutesAgo(2),
  },
  {
    taskId: 'task-20260514-003',
    databaseName: 'dw_risk',
    tableName: 'risk_feature_wide_di',
    targetSampleRows: 3000,
    sampledRows: 0,
    parentStatus: 'FAILED',
    createdAt: minutesAgo(85),
    updatedAt: minutesAgo(70),
  },
]

export const mockTaskPipelines: Record<string, TaskPipelineResponse> = {
  'task-20260514-001': {
    taskId: 'task-20260514-001',
    parentStatus: 'SUCCESS',
    executors: [
      createExecutor('RetrieveMetaInfosExecutor', 'SUCCESS', 'Load table metadata', 'Loaded schema, partition info, and estimated row count', minutesAgo(48)),
      createExecutor('PartitionSelectorExecutor', 'SUCCESS', 'Select target partitions', 'Selected 3 partitions for sampling', minutesAgo(47)),
      createExecutor('SamplingExecutor', 'SUCCESS', 'Build sampling SQL', 'Built partition-level sampling SQL', minutesAgo(45)),
      createExecutor('FinalQueryBuilderExecutor', 'SUCCESS', 'Build final query', 'Merged shard queries and completed projection fields', minutesAgo(42)),
      createExecutor('QueryDispatcherExecutor', 'SUCCESS', 'Dispatch execution tasks', 'All 3 shards returned successfully', minutesAgo(38)),
      createExecutor('ResultCollectorExecutor', 'SUCCESS', 'Collect shard results', 'Collected sampledRows=2709', minutesAgo(37)),
      createExecutor('FinalizeTaskExecutor', 'SUCCESS', 'Finalize task outcome', 'Sampling target reached and parent task finished successfully', minutesAgo(36)),
    ],
  },
  'task-20260514-002': {
    taskId: 'task-20260514-002',
    parentStatus: 'RUNNING',
    executors: [
      createExecutor('RetrieveMetaInfosExecutor', 'SUCCESS', 'Load table metadata', 'Metadata loaded, moving to partition selection', minutesAgo(29)),
      createExecutor('PartitionSelectorExecutor', 'SUCCESS', 'Select target partitions', 'Selected 2 hot partitions', minutesAgo(27)),
      createExecutor('SamplingExecutor', 'SUCCESS', 'Build sampling SQL', 'Sampling SQL has been generated', minutesAgo(23)),
      createExecutor('FinalQueryBuilderExecutor', 'SUCCESS', 'Build final query', 'Final query has been handed to dispatcher', minutesAgo(18)),
      createExecutor('QueryDispatcherExecutor', 'RUNNING', 'Dispatch execution tasks', '2 shards are still running and sampledRows is still increasing', minutesAgo(2)),
      createExecutor('ResultCollectorExecutor', 'RUNNING', 'Collect shard results', 'Accumulating sampledRows', minutesAgo(1)),
      createExecutor('FinalizeTaskExecutor', 'PENDING', 'Finalize task outcome', 'Waiting for result collection to finish', ''),
    ],
  },
  'task-20260514-003': {
    taskId: 'task-20260514-003',
    parentStatus: 'FAILED',
    executors: [
      createExecutor('RetrieveMetaInfosExecutor', 'SUCCESS', 'Load table metadata', 'Metadata loaded successfully', minutesAgo(84)),
      createExecutor('PartitionSelectorExecutor', 'SUCCESS', 'Select target partitions', 'Candidate partitions confirmed', minutesAgo(83)),
      createExecutor('SamplingExecutor', 'FAILED', 'Build sampling SQL', 'Invalid partition filter caused SQL generation to fail', minutesAgo(82)),
      createExecutor('FinalQueryBuilderExecutor', 'PENDING', 'Build final query', 'Waiting for upstream executor to complete', ''),
      createExecutor('QueryDispatcherExecutor', 'PENDING', 'Dispatch execution tasks', 'Waiting for upstream executor to complete', ''),
      createExecutor('ResultCollectorExecutor', 'PENDING', 'Collect shard results', 'Waiting for upstream executor to complete', ''),
      createExecutor('FinalizeTaskExecutor', 'PENDING', 'Finalize task outcome', 'Waiting for upstream executor to complete', ''),
    ],
  },
}

export const mockTaskShards: Record<string, ShardRecord[]> = {
  'task-20260514-001': [
    createShard('shard-1', 'dt=2026-05-10', 'SUCCESS', 912, minutesAgo(38), 'worker-a'),
    createShard('shard-2', 'dt=2026-05-11', 'SUCCESS', 901, minutesAgo(38), 'worker-b'),
    createShard('shard-3', 'dt=2026-05-12', 'SUCCESS', 896, minutesAgo(38), 'worker-c'),
  ],
  'task-20260514-002': [
    createShard('shard-1', 'dt=2026-05-10', 'RUNNING', 510, minutesAgo(2), 'worker-a'),
    createShard('shard-2', 'dt=2026-05-11', 'DISPATCHED', 390, minutesAgo(1), 'worker-b'),
  ],
  'task-20260514-003': [
    createShard('shard-1', 'dt=2026-05-12', 'FAILED', 0, minutesAgo(82), 'worker-a', 'Hive SQL compile error'),
    createShard('shard-2', 'dt=2026-05-13', 'CANCELLED', 0, minutesAgo(82), 'worker-b', 'Cancelled after upstream failure'),
  ],
}

export const mockTaskLogs: Record<string, TaskLogItem[]> = {
  'task-20260514-001': [
    createLog('1', minutesAgo(48), 'INFO', 'RetrieveMetaInfosExecutor loaded table schema and partition infos'),
    createLog('2', minutesAgo(45), 'INFO', 'SamplingExecutor generated 3 partition-level sampling statements'),
    createLog('3', minutesAgo(38), 'INFO', 'QueryDispatcherExecutor finished all shards with sampledRows=2709'),
  ],
  'task-20260514-002': [
    createLog('1', minutesAgo(18), 'INFO', 'FinalQueryBuilderExecutor produced final SQL bundle'),
    createLog('2', minutesAgo(3), 'INFO', 'Shard shard-1 reported partial sampledRows=510'),
    createLog('3', minutesAgo(1), 'DEBUG', 'Waiting more shard callbacks before parent task completion'),
  ],
  'task-20260514-003': [
    createLog('1', minutesAgo(84), 'INFO', 'Meta infos loaded successfully'),
    createLog('2', minutesAgo(82), 'ERROR', 'Partition expression parse failed near dt>=2026-05-12'),
    createLog('3', minutesAgo(82), 'WARN', 'Parent task marked FAILED, downstream executors skipped'),
  ],
}

function createExecutor(
  executorName: PipelineExecutorResult['executorName'],
  status: PipelineExecutorResult['status'],
  action: string,
  outputSummary: string,
  executedAt: string,
): PipelineExecutorResult {
  return {
    executorName,
    status,
    success: status === 'SUCCESS' ? true : status === 'FAILED' ? false : null,
    action,
    outputSummary,
    executedAt,
    startedAt: executedAt,
    finishedAt: status === 'RUNNING' || status === 'PENDING' ? '' : executedAt,
    errorMessage: status === 'FAILED' ? outputSummary : '',
  }
}

function createShard(
  shardId: string,
  partitionName: string,
  status: ShardRecord['status'],
  sampledRows: number,
  updatedAt: string,
  worker: string,
  message?: string,
): ShardRecord {
  return {
    shardId,
    partitionName,
    status,
    sampledRows,
    updatedAt,
    worker,
    message,
  }
}

function createLog(id: string, timestamp: string, level: TaskLogItem['level'], message: string): TaskLogItem {
  return {
    id,
    timestamp,
    level,
    message,
  }
}
