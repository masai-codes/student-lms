import type { EnrolledBatch, EnrolledBatchRow } from '@/server/learn/types'

export function mapEnrolledBatchRow(row: EnrolledBatchRow): EnrolledBatch {
  const courseTitle = extractCourseTitle(row.meta) ?? row.name

  return {
    batchId: row.id,
    courseTitle,
  }
}

function extractCourseTitle(meta: unknown): string | null {
  if (meta == null || typeof meta !== 'object') {
    return null
  }

  const maybeCourseTitle = (meta as Record<string, unknown>).courseTitle
  if (typeof maybeCourseTitle !== 'string') {
    return null
  }

  const trimmed = maybeCourseTitle.trim()
  return trimmed.length > 0 ? trimmed : null
}
