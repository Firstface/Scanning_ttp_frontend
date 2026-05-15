import type { DatabaseTableOption, ExecutorName } from './types'

export const API_BASE_URL = 'http://localhost:8080'

export const PIPELINE_EXECUTORS: ExecutorName[] = [
  'RetrieveMetaInfosExecutor',
  'PartitionSelectorExecutor',
  'SamplingExecutor',
  'FinalQueryBuilderExecutor',
  'QueryDispatcherExecutor',
  'ResultCollectorExecutor',
  'FinalizeTaskExecutor',
]

export const DATABASE_OPTIONS: DatabaseTableOption[] = [
  {
    databaseName: 'dw_app',
    tables: [
      {
        tableName: 'user_behavior_di',
        partitions: ['dt=2026-05-10', 'dt=2026-05-11', 'dt=2026-05-12'],
      },
      {
        tableName: 'user_profile_df',
        partitions: ['region=cn', 'region=sg', 'region=us'],
      },
    ],
  },
  {
    databaseName: 'dw_trade',
    tables: [
      {
        tableName: 'order_snapshot_di',
        partitions: ['dt=2026-05-09', 'dt=2026-05-10', 'dt=2026-05-11'],
      },
      {
        tableName: 'payment_result_df',
        partitions: ['channel=wechat', 'channel=alipay', 'channel=card'],
      },
    ],
  },
  {
    databaseName: 'dw_risk',
    tables: [
      {
        tableName: 'risk_feature_wide_di',
        partitions: ['dt=2026-05-12', 'dt=2026-05-13', 'dt=2026-05-14'],
      },
    ],
  },
]

export const LOCAL_TASKS_KEY = 'sample-task-records'
