import type { LearningType } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { DashboardScheduleItem, ScheduleEntityRow } from './scheduleTypes'
import {
  mapLearningEntityRow,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { buildLearnListingCardCtas } from '@/server/learn/utils/buildLearnListingCardCtas'

/**
 * Maps a schedule/pending row to a `DashboardScheduleItem`, reusing the learn
 * listing CTA builder + row mapper so the same card renders it. Shared by the
 * schedule and pending-tasks feeds.
 */
export function buildDashboardScheduleItem(input: {
  row: ScheduleEntityRow
  learningType: LearningType
  nowMs: number
  attendance: LectureAttendanceSummary | null
  assignmentProgressStatus: AssignmentProgressStatus | null
  showCourseName: boolean
}): DashboardScheduleItem {
  const { row, learningType, nowMs, attendance, assignmentProgressStatus } = input

  const listingCtas = buildLearnListingCardCtas({
    learningType,
    itemType: row.type,
    schedule: row.schedule,
    concludes: row.concludes ?? null,
    isMandatory: toLearningPriority(row.optional) === 'mandatory',
    zoomLink: row.zoomLink ?? null,
    nowMs,
    attendance,
    assignmentProgressStatus,
  })

  const item = mapLearningEntityRow(
    row,
    learningType,
    listingCtas,
    attendance,
    assignmentProgressStatus,
    null,
  )

  return {
    ...item,
    concludes: row.concludes ?? null,
    courseName: input.showCourseName ? resolveCourseName(row) : null,
    enableZoomWebView: resolveEnableZoomWebView(row.sectionSettings),
  }
}

/** sections.name → batches.name → null (the learn "which course" label chain). */
function resolveCourseName(row: ScheduleEntityRow): string | null {
  return row.sectionName?.trim() || row.batchName?.trim() || null
}

function resolveEnableZoomWebView(settings: unknown): boolean {
  if (settings && typeof settings === 'object' && 'enableZoomWebView' in settings) {
    return settings.enableZoomWebView === true
  }
  return false
}
