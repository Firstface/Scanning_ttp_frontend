export type ParentTaskStatus =
  | 'CREATED'
  | 'PIPELINE_RUNNING'
  | 'DISPATCHED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'

export type ExecutorViewStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

export type ShardStatus =
  | 'CREATED'
  | 'DISPATCHED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export type ExecutorName =
  | 'RetrieveMetaInfosExecutor'
  | 'PartitionSelectorExecutor'
  | 'SamplingExecutor'
  | 'FinalQueryBuilderExecutor'
  | 'QueryDispatcherExecutor'
  | 'ResultCollectorExecutor'
  | 'FinalizeTaskExecutor'

export interface CreateSampleTaskRequest {
  databaseName: string
  tableName: string
  targetSampleRows: number
  selectedPartitions: string[]
}

export interface SampleTaskRecord {
  taskId: string
  databaseName: string
  tableName: string
  targetSampleRows: number
  sampledRows: number
  parentStatus: ParentTaskStatus
  createdAt: string
  updatedAt: string
}

export interface SampleTaskDetail extends SampleTaskRecord {
  sampledResultPreview?: string
}

export interface PipelineExecutorResult {
  executorName: ExecutorName
  status: ExecutorViewStatus
  success: boolean | null
  action: string
  outputSummary: string
  executedAt: string
  startedAt: string
  finishedAt: string
  errorMessage: string
}

export interface TaskPipelineResponse {
  taskId: string
  parentStatus: ParentTaskStatus
  executors: PipelineExecutorResult[]
}

export interface ShardRecord {
  shardId: string
  partitionName: string
  status: ShardStatus
  sampledRows: number
  worker?: string
  updatedAt: string
  message?: string
}

export interface TaskLogItem {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

export interface DatabaseTableOption {
  databaseName: string
  tables: Array<{
    tableName: string
    partitions: string[]
  }>
}
