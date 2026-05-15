import { mockTaskLogs, mockTaskPipelines, mockTaskRecords, mockTaskShards } from '../data/mockRecords'
import { API_BASE_URL, LOCAL_TASKS_KEY, PIPELINE_EXECUTORS } from '../lib/constants'
import { buildDefaultPipeline, normalizeParentStatus } from '../lib/utils'
import type {
  CreateSampleTaskRequest,
  PipelineExecutorResult,
  SampleTaskDetail,
  SampleTaskRecord,
  ShardRecord,
  TaskLogItem,
  TaskPipelineResponse,
} from '../lib/types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {})
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function createSampleTask(payload: CreateSampleTaskRequest): Promise<{ taskId: string }> {
  const result = await request<{ taskId?: string; id?: string }>('/api/sample-tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const taskId = result.taskId ?? result.id
  if (!taskId) {
    throw new Error('POST /api/sample-tasks did not return a taskId')
  }

  saveLocalTaskRecord({
    taskId,
    databaseName: payload.databaseName,
    tableName: payload.tableName,
    targetSampleRows: payload.targetSampleRows,
    sampledRows: 0,
    parentStatus: 'CREATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { taskId }
}

export async function getSampleTask(taskId: string): Promise<SampleTaskDetail> {
  try {
    const data = await request<Record<string, unknown>>(`/api/sample-tasks/${taskId}`)
    return normalizeTaskDetail(data, taskId)
  } catch {
    const local = getLocalTaskRecords().find((item) => item.taskId === taskId)
    if (local) {
      return local
    }

    const mock = mockTaskRecords.find((item) => item.taskId === taskId)
    if (mock) {
      return mock
    }

    throw new Error(`Task ${taskId} was not found`)
  }
}

export async function getSampleTaskPipeline(taskId: string): Promise<TaskPipelineResponse> {
  try {
    const data = await request<unknown>(`/api/sample-tasks/${taskId}/pipeline`)
    return normalizePipeline(data, taskId)
  } catch {
    const mock = mockTaskPipelines[taskId]
    if (mock) {
      return mock
    }

    const task = await getSampleTask(taskId)
    return {
      ...buildDefaultPipeline(task.parentStatus),
      taskId,
    }
  }
}

export async function getSampleTaskShards(taskId: string): Promise<ShardRecord[]> {
  try {
    const data = await request<unknown>(`/api/sample-tasks/${taskId}/shards`)
    return normalizeShards(data)
  } catch {
    return mockTaskShards[taskId] ?? []
  }
}

export async function getSampleTaskLogs(taskId: string): Promise<TaskLogItem[]> {
  try {
    const data = await request<unknown>(`/api/sample-tasks/${taskId}/logs`)
    return normalizeLogs(data)
  } catch {
    return mockTaskLogs[taskId] ?? []
  }
}

export async function listSampleTasks(): Promise<SampleTaskRecord[]> {
  try {
    const data = await request<unknown>('/api/sample-tasks')
    return normalizeTaskList(data)
  } catch {
    return mergeRecords(getLocalTaskRecords(), mockTaskRecords)
  }
}

function normalizeTaskList(input: unknown): SampleTaskRecord[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.map((item, index) => normalizeTaskRecordOnly(asObject(item), `task-${index}`))
}

function normalizeTaskDetail(input: Record<string, unknown>, fallbackTaskId: string): SampleTaskDetail {
  const detail = normalizeTaskRecordOnly(input, fallbackTaskId)
  saveLocalTaskRecord(detail)
  return detail
}

function normalizeTaskRecordOnly(input: Record<string, unknown>, fallbackTaskId: string): SampleTaskDetail {
  const taskId = pickString(input, ['taskId', 'id'], fallbackTaskId)
  const databaseName = pickString(input, ['databaseName', 'database', 'dbName'], 'unknown_db')
  const tableName = pickString(input, ['tableName', 'table'], 'unknown_table')
  const targetSampleRows = pickNumber(input, ['targetSampleRows', 'targetRows'], 0)
  const sampledRows = pickNumber(input, ['sampledRows', 'actualSampleRows'], 0)
  const parentStatus = normalizeParentStatus(
    pickString(input, ['parentStatus', 'status', 'parentTaskStatus'], 'CREATED'),
  )
  const createdAt = pickString(input, ['createdAt', 'createTime'], new Date().toISOString())
  const updatedAt = pickString(input, ['updatedAt', 'updateTime'], createdAt)

  const detail: SampleTaskDetail = {
    taskId,
    databaseName,
    tableName,
    targetSampleRows,
    sampledRows,
    parentStatus,
    createdAt,
    updatedAt,
  }

  return detail
}

function normalizePipeline(input: unknown, taskId: string, fallbackParentStatus?: SampleTaskRecord['parentStatus']): TaskPipelineResponse {
  const source = asObject(input)
  const executorsSource = Array.isArray(input)
    ? input
    : Array.isArray(source.executors)
      ? source.executors
      : Array.isArray(source.executorResults)
        ? source.executorResults
        : []

  const normalizedParentStatus = normalizeParentStatus(
    pickString(source, ['parentStatus', 'status'], fallbackParentStatus ?? 'CREATED'),
  )

  const executors = PIPELINE_EXECUTORS.map((executorName, index) => {
    const matched = executorsSource.find((item) => {
      const candidate = asObject(item)
      return pickString(candidate, ['executorName', 'name'], '') === executorName
    })

    return normalizeExecutor(asObject(matched), executorName, index)
  })

  const inferredExecutors = inferExecutorStatuses(executors, normalizedParentStatus)

  return {
    taskId,
    parentStatus: normalizedParentStatus,
    executors: inferredExecutors,
  }
}

function normalizeExecutor(
  input: Record<string, unknown>,
  executorName: PipelineExecutorResult['executorName'],
  index: number,
): PipelineExecutorResult {
  const rawStatus = pickString(input, ['status'], '')
  const successValue = input.success

  let status: PipelineExecutorResult['status'] = 'PENDING'
  if (rawStatus) {
    const upper = rawStatus.toUpperCase()
    if (upper === 'RUNNING' || upper === 'SUCCESS' || upper === 'FAILED' || upper === 'PENDING') {
      status = upper
    }
  } else if (typeof successValue === 'boolean') {
    status = successValue ? 'SUCCESS' : 'FAILED'
  }

  return {
    executorName,
    status,
    success: typeof successValue === 'boolean' ? successValue : status === 'SUCCESS' ? true : status === 'FAILED' ? false : null,
    action: pickString(input, ['action', 'description'], status === 'PENDING' ? `Waiting for Step ${index + 1}` : 'Executing pipeline step'),
    outputSummary: pickString(input, ['outputSummary', 'summary', 'message'], status === 'PENDING' ? 'This step has not started yet' : 'This step has been processed'),
    executedAt: pickString(input, ['executedAt', 'finishedAt', 'updateTime', 'timestamp', 'startedAt'], ''),
    startedAt: pickString(input, ['startedAt'], ''),
    finishedAt: pickString(input, ['finishedAt', 'executedAt'], ''),
    errorMessage: pickString(input, ['errorMessage'], ''),
  }
}

function inferExecutorStatuses(
  executors: PipelineExecutorResult[],
  parentStatus: SampleTaskRecord['parentStatus'],
): PipelineExecutorResult[] {
  const results = executors.map((executor) => ({ ...executor }))
  const hasExplicitRunningOrFailed = results.some(
    (item) => item.status === 'RUNNING' || item.status === 'FAILED',
  )

  if (hasExplicitRunningOrFailed) {
    return results
  }

  const pendingIndex = results.findIndex((item) => item.status === 'PENDING')
  const failedIndex = results.findIndex((item) => item.status === 'FAILED')
  if (failedIndex >= 0) {
    return results
  }

  if (parentStatus === 'FAILED' && pendingIndex >= 0) {
    results[pendingIndex] = {
      ...results[pendingIndex],
      status: 'FAILED',
      success: false,
      outputSummary:
        results[pendingIndex].outputSummary === 'This step has not started yet'
          ? 'The parent task failed at this stage'
          : results[pendingIndex].outputSummary,
      errorMessage:
        results[pendingIndex].errorMessage || 'The parent task failed at this stage. Check logs for details.',
    }
    return results
  }

  if ((parentStatus === 'PIPELINE_RUNNING' || parentStatus === 'RUNNING' || parentStatus === 'DISPATCHED') && pendingIndex >= 0) {
    results[pendingIndex] = {
      ...results[pendingIndex],
      status: 'RUNNING',
      success: null,
      outputSummary:
        results[pendingIndex].outputSummary === 'This step has not started yet'
          ? 'This step is running'
          : results[pendingIndex].outputSummary,
    }
    return results
  }

  if ((parentStatus === 'PIPELINE_RUNNING' || parentStatus === 'RUNNING' || parentStatus === 'DISPATCHED') && pendingIndex === -1 && results.length > 0) {
    const lastIndex = results.length - 1
    results[lastIndex] = {
      ...results[lastIndex],
      status: 'RUNNING',
      success: null,
      outputSummary:
        results[lastIndex].outputSummary === 'This step has been processed'
          ? 'This step is running'
          : results[lastIndex].outputSummary,
    }
  }

  return results
}

function normalizeShards(input: unknown): ShardRecord[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.map((item, index) => {
    const source = asObject(item)
    return {
      shardId: pickString(source, ['shardId', 'id'], `shard-${index + 1}`),
      partitionName: pickPartitionName(source),
      status: normalizeShardStatus(pickString(source, ['status'], 'CREATED')),
      sampledRows: pickNumber(source, ['sampledRows', 'rows'], 0),
      worker: pickString(source, ['worker', 'executorHost'], ''),
      updatedAt: pickString(source, ['updatedAt', 'updateTime'], ''),
      message: pickString(source, ['message', 'errorMessage'], ''),
    }
  })
}

function normalizeLogs(input: unknown): TaskLogItem[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.map((item, index) => {
    if (typeof item === 'string') {
      return normalizeStringLog(item, index)
    }

    const source = asObject(item)
    return {
      id: pickString(source, ['id'], `${index}`),
      timestamp: pickString(source, ['timestamp', 'time', 'createdAt'], ''),
      level: normalizeLogLevel(pickString(source, ['level'], 'INFO')),
      message: pickString(source, ['message', 'content'], ''),
    }
  })
}

function normalizeStringLog(line: string, index: number): TaskLogItem {
  const parts = line.split(' | ')
  const timestamp = parts[0] ?? ''
  const message = parts.slice(1).join(' | ') || line
  const level = message.includes('FAILED') || message.includes('ERROR')
    ? 'ERROR'
    : message.includes('WARN')
      ? 'WARN'
      : message.includes('DEBUG')
        ? 'DEBUG'
        : 'INFO'

  return {
    id: `${index}`,
    timestamp,
    level,
    message,
  }
}

function pickPartitionName(input: Record<string, unknown>): string {
  const direct = pickString(input, ['partitionName', 'partition', 'partitionSpec'], '')
  if (direct) {
    return direct
  }

  const group = input.partitionGroup
  if (Array.isArray(group)) {
    return group.filter((item): item is string => typeof item === 'string').join(', ')
  }

  return '-'
}

function normalizeShardStatus(value: string): ShardRecord['status'] {
  const normalized = value.toUpperCase()
  switch (normalized) {
    case 'CREATED':
    case 'DISPATCHED':
    case 'RUNNING':
    case 'SUCCESS':
    case 'FAILED':
    case 'CANCELLED':
      return normalized
    default:
      return 'CREATED'
  }
}

function normalizeLogLevel(value: string): TaskLogItem['level'] {
  const normalized = value.toUpperCase()
  switch (normalized) {
    case 'INFO':
    case 'WARN':
    case 'ERROR':
    case 'DEBUG':
      return normalized
    default:
      return 'INFO'
  }
}

function asObject(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
}

function pickString(input: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return fallback
}

function pickNumber(input: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return fallback
}

function saveLocalTaskRecord(record: SampleTaskRecord) {
  if (typeof window === 'undefined') {
    return
  }

  const current = getLocalTaskRecords()
  const merged = mergeRecords([record], current)
  window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(merged))
}

function getLocalTaskRecords(): SampleTaskRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(LOCAL_TASKS_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeTaskList(parsed)
  } catch {
    return []
  }
}

function mergeRecords(primary: SampleTaskRecord[], secondary: SampleTaskRecord[]): SampleTaskRecord[] {
  const map = new Map<string, SampleTaskRecord>()
  for (const item of [...primary, ...secondary]) {
    map.set(item.taskId, item)
  }

  return Array.from(map.values()).sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}
