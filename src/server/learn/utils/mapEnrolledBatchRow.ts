import type { EnrolledBatch, EnrolledBatchRow } from '@/server/learn/types'

export function mapEnrolledBatchRow(row: EnrolledBatchRow): EnrolledBatch {
  return {
    batchId: row.id,
    title: row.name,
  }
}
