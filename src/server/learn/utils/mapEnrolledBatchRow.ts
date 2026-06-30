import type { EnrolledBatch, EnrolledBatchRow } from '@/server/learn/types'

export function mapEnrolledBatchRow(row: EnrolledBatchRow): EnrolledBatch {
  const courseTitle = extractCourseTitle(row.meta) ?? row.name
  const courseLogo = extractCourseLogo(row.meta)
  const settings =
    row.settings != null && typeof row.settings === 'object'
      ? (row.settings as Record<string, unknown>)
      : {}

  return {
    batchId: row.id,
    courseTitle,
    courseLogo,
    showAttendanceReport: settings.showAttendanceReport === true,
    showEvaluationReport: settings.showEvaluationReport === true,
    showBatchDetails: settings.showBatchDetails === true,
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

function extractCourseLogo(meta: unknown): string | null {
  if (meta == null || typeof meta !== 'object') {
    return null
  }

  const maybeLogo = (meta as Record<string, unknown>).courseLogo
  if (typeof maybeLogo !== 'string') {
    return null
  }

  const trimmed = maybeLogo.trim()
  return trimmed.length > 0 ? trimmed : null
}
