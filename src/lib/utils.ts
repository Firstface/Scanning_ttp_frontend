import { PIPELINE_EXECUTORS } from './constants'
import type {
  ParentTaskStatus,
  PipelineExecutorResult,
  SampleTaskDetail,
  SampleTaskRecord,
  ShardRecord,
  TaskLogItem,
  TaskPipelineResponse,
} from './types'

export function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function isTerminalStatus(status?: ParentTaskStatus): boolean {
  return status === 'SUCCESS' || status === 'FAILED'
}

export function getTaskQualifiedName(task?: Pick<SampleTaskRecord, 'databaseName' | 'tableName'>): string {
  if (!task) {
    return '-'
  }

  return `${task.databaseName}.${task.tableName}`
}

export function normalizeParentStatus(value?: string): ParentTaskStatus {
  const normalized = (value ?? '').toUpperCase()
  switch (normalized) {
    case 'CREATED':
    case 'PIPELINE_RUNNING':
    case 'DISPATCHED':
    case 'RUNNING':
    case 'SUCCESS':
    case 'FAILED':
      return normalized
    default:
      return 'CREATED'
  }
}

export function buildDefaultPipeline(status: ParentTaskStatus): TaskPipelineResponse {
  const executors: PipelineExecutorResult[] = PIPELINE_EXECUTORS.map((executorName, index) => {
    let stepStatus: PipelineExecutorResult['status'] = 'PENDING'

    if (status === 'FAILED' && index === PIPELINE_EXECUTORS.length - 1) {
      stepStatus = 'FAILED'
    } else if (
      status === 'PIPELINE_RUNNING' &&
      index < 2
    ) {
      stepStatus = index === 1 ? 'RUNNING' : 'SUCCESS'
    } else if (status === 'DISPATCHED' && index < 4) {
      stepStatus = index === 3 ? 'RUNNING' : 'SUCCESS'
    } else if (status === 'RUNNING') {
      stepStatus = index === PIPELINE_EXECUTORS.length - 1 ? 'RUNNING' : 'SUCCESS'
    } else if (status === 'SUCCESS') {
      stepStatus = 'SUCCESS'
    }

    return {
      executorName,
      status: stepStatus,
      success: stepStatus === 'SUCCESS' ? true : stepStatus === 'FAILED' ? false : null,
      action: defaultExecutorAction(executorName, stepStatus),
      outputSummary:
        stepStatus === 'PENDING'
          ? 'This executor has not started yet'
          : stepStatus === 'RUNNING'
            ? 'This stage is in progress'
            : stepStatus === 'FAILED'
              ? 'This stage failed'
              : 'This stage completed successfully',
      executedAt: stepStatus === 'PENDING' ? '' : new Date().toISOString(),
      startedAt: stepStatus === 'PENDING' ? '' : new Date().toISOString(),
      finishedAt: stepStatus === 'SUCCESS' || stepStatus === 'FAILED' ? new Date().toISOString() : '',
      errorMessage: stepStatus === 'FAILED' ? 'This stage failed' : '',
    }
  })

  return {
    taskId: '',
    parentStatus: status,
    executors,
  }
}

export function summarizeShards(shards: ShardRecord[]) {
  const total = shards.length
  const success = shards.filter((item) => item.status === 'SUCCESS').length
  const failed = shards.filter((item) => item.status === 'FAILED').length
  const cancelled = shards.filter((item) => item.status === 'CANCELLED').length

  return {
    total,
    success,
    failed,
    cancelled,
  }
}

export function extendPipelineLifecycle(
  pipeline: TaskPipelineResponse,
  task: SampleTaskDetail,
  shards: ShardRecord[],
  logs: TaskLogItem[],
): TaskPipelineResponse {
  const executors = PIPELINE_EXECUTORS.map((executorName) => {
    const existing = pipeline.executors.find((item) => item.executorName === executorName)
    return existing ?? createPendingExecutor(executorName)
  })

  const firstFiveSucceeded = executors
    .slice(0, 5)
    .every((item) => item.status === 'SUCCESS')
  const anyPrimaryFailed = executors
    .slice(0, 5)
    .some((item) => item.status === 'FAILED')
  const hasShardActivity = shards.some((item) =>
    ['DISPATCHED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(item.status),
  )
  const allShardsTerminal = shards.length > 0 && shards.every((item) =>
    ['SUCCESS', 'FAILED', 'CANCELLED'].includes(item.status),
  )

  const collectorIndex = executors.findIndex((item) => item.executorName === 'ResultCollectorExecutor')
  const finalizeIndex = executors.findIndex((item) => item.executorName === 'FinalizeTaskExecutor')

  if (!anyPrimaryFailed && firstFiveSucceeded && collectorIndex >= 0) {
    executors[collectorIndex] = deriveCollectorStep(
      executors[collectorIndex],
      task,
      shards,
      logs,
      hasShardActivity,
      allShardsTerminal,
    )
  }

  if (!anyPrimaryFailed && firstFiveSucceeded && finalizeIndex >= 0) {
    executors[finalizeIndex] = deriveFinalizeStep(
      executors[finalizeIndex],
      task,
      logs,
      allShardsTerminal,
    )
  }

  return {
    ...pipeline,
    parentStatus: task.parentStatus,
    executors,
  }
}

function createPendingExecutor(executorName: PipelineExecutorResult['executorName']): PipelineExecutorResult {
  return {
    executorName,
    status: 'PENDING',
    success: null,
    action: defaultExecutorAction(executorName, 'PENDING'),
    outputSummary: 'This stage has not started yet',
    executedAt: '',
    startedAt: '',
    finishedAt: '',
    errorMessage: '',
  }
}

function defaultExecutorAction(
  executorName: PipelineExecutorResult['executorName'],
  status: PipelineExecutorResult['status'],
) {
  const actionMap: Record<PipelineExecutorResult['executorName'], string> = {
    RetrieveMetaInfosExecutor: 'Load table metadata',
    PartitionSelectorExecutor: 'Select partitions',
    SamplingExecutor: 'Build sampling SQL',
    FinalQueryBuilderExecutor: 'Build final query',
    QueryDispatcherExecutor: 'Dispatch shard tasks',
    ResultCollectorExecutor: 'Collect shard results',
    FinalizeTaskExecutor: 'Finalize task outcome',
  }

  return status === 'PENDING' ? `Waiting for ${actionMap[executorName]}` : actionMap[executorName]
}

function deriveCollectorStep(
  current: PipelineExecutorResult,
  task: SampleTaskDetail,
  shards: ShardRecord[],
  logs: TaskLogItem[],
  hasShardActivity: boolean,
  allShardsTerminal: boolean,
): PipelineExecutorResult {
  const collectorLogs = logs.filter((item) => item.message.includes('ResultCollectorExecutor'))
  const collectorStartedAt = collectorLogs[0]?.timestamp ?? shards[0]?.updatedAt ?? current.startedAt
  const collectorLastAt =
    collectorLogs[collectorLogs.length - 1]?.timestamp ??
    shards[shards.length - 1]?.updatedAt ??
    current.finishedAt

  if (collectorLogs.some((item) => /FAILED|ERROR/i.test(item.message))) {
    return {
      ...current,
      status: 'FAILED',
      success: false,
      action: defaultExecutorAction(current.executorName, 'FAILED'),
      outputSummary: collectorLogs[collectorLogs.length - 1]?.message ?? 'Result collection failed',
      executedAt: collectorLastAt,
      startedAt: collectorStartedAt,
      finishedAt: collectorLastAt,
      errorMessage: collectorLogs[collectorLogs.length - 1]?.message ?? 'Result collection failed',
    }
  }

  if (task.parentStatus === 'SUCCESS' || task.parentStatus === 'FAILED' || allShardsTerminal) {
    return {
      ...current,
      status: 'SUCCESS',
      success: true,
      action: defaultExecutorAction(current.executorName, 'SUCCESS'),
      outputSummary: `Collected sampledRows=${task.sampledRows} from ${shards.length} shards`,
      executedAt: collectorLastAt,
      startedAt: collectorStartedAt,
      finishedAt: collectorLastAt,
      errorMessage: '',
    }
  }

  if (hasShardActivity || task.parentStatus === 'RUNNING' || task.parentStatus === 'DISPATCHED') {
    return {
      ...current,
      status: 'RUNNING',
      success: null,
      action: defaultExecutorAction(current.executorName, 'RUNNING'),
      outputSummary: `Collecting shard results. Current sampledRows=${task.sampledRows}`,
      executedAt: '',
      startedAt: collectorStartedAt,
      finishedAt: '',
      errorMessage: '',
    }
  }

  return current
}

function deriveFinalizeStep(
  current: PipelineExecutorResult,
  task: SampleTaskDetail,
  logs: TaskLogItem[],
  allShardsTerminal: boolean,
): PipelineExecutorResult {
  const finalizeLog =
    [...logs].reverse().find((item) => item.message.includes('finalized status=')) ??
    [...logs].reverse().find((item) => item.message.includes('Finalize'))
  const finalizeAt = finalizeLog?.timestamp ?? task.updatedAt

  if (task.parentStatus === 'SUCCESS') {
    return {
      ...current,
      status: 'SUCCESS',
      success: true,
      action: defaultExecutorAction(current.executorName, 'SUCCESS'),
      outputSummary: `Sampling target reached: ${task.sampledRows} / ${task.targetSampleRows}`,
      executedAt: finalizeAt,
      startedAt: finalizeAt,
      finishedAt: finalizeAt,
      errorMessage: '',
    }
  }

  if (task.parentStatus === 'FAILED') {
    const reason =
      finalizeLog?.message ||
      `Sampling target not reached: sampledRows=${task.sampledRows} < targetSampleRows=${task.targetSampleRows}`

    return {
      ...current,
      status: 'FAILED',
      success: false,
      action: defaultExecutorAction(current.executorName, 'FAILED'),
      outputSummary: reason,
      executedAt: finalizeAt,
      startedAt: finalizeAt,
      finishedAt: finalizeAt,
      errorMessage: reason,
    }
  }

  if (allShardsTerminal) {
    return {
      ...current,
      status: 'RUNNING',
      success: null,
      action: defaultExecutorAction(current.executorName, 'RUNNING'),
      outputSummary: 'All shards are complete. Final status is being determined.',
      executedAt: '',
      startedAt: finalizeAt,
      finishedAt: '',
      errorMessage: '',
    }
  }

  return current
}
