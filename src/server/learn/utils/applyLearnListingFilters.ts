import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { BatchLearningFiltersInput, LearningItem } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

function parseMs(value: string | null | undefined): number | null {
  if (value == null) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

function startOfDayFromYmd(ymd: string): number {
  const parts = ymd.split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(y, m - 1, d).setHours(0, 0, 0, 0)
}

function startOfDayFromSchedule(scheduleISO: string | null): number | null {
  if (scheduleISO == null || scheduleISO.trim() === '') return null
  const t = parseMs(scheduleISO)
  if (t == null) return null
  const dt = new Date(t)
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
}

function matchesScheduleBounds(
  scheduleDate: string | null,
  startYmd?: string,
  endYmd?: string,
): boolean {
  const hasLower = startYmd != null && startYmd.trim() !== ''
  const hasUpper = endYmd != null && endYmd.trim() !== ''
  if (!hasLower && !hasUpper) return true

  const itemDay = startOfDayFromSchedule(scheduleDate)
  if (itemDay == null) return false

  if (hasLower && itemDay < startOfDayFromYmd(startYmd!)) return false
  if (hasUpper && itemDay > startOfDayFromYmd(endYmd!)) return false

  return true
}

function matchesSchedulePhase(
  row: LearningEntityRow,
  phase: BatchLearningFiltersInput['schedulePhase'],
  nowMs: number,
): boolean {
  if (phase == null || phase === 'all') return true

  const schedule = row.schedule
  const concludes = row.concludes ?? null

  if (schedule != null && concludes != null) {
    const ended = isLectureSessionEnded({ schedule, concludes, nowMs })
    return phase === 'past' ? ended : !ended
  }

  const scheduleMs = parseMs(schedule)
  if (scheduleMs == null) return false

  return phase === 'upcoming' ? scheduleMs >= nowMs : scheduleMs < nowMs
}

function matchesAttendance(
  attendance: LectureAttendanceSummary | null,
  status: BatchLearningFiltersInput['attendanceStatus'],
): boolean {
  if (status == null) return true
  if (attendance == null) return false
  if (status === 'present') return attendance.overallStatus === 1
  return attendance.overallStatus === 0
}

function matchesAssignmentProgress(
  progress: AssignmentProgressStatus | null,
  statuses: BatchLearningFiltersInput['assignmentProgressStatuses'],
): boolean {
  if (statuses == null || statuses.length === 0) return true
  if (progress == null) return false
  return statuses.includes(progress)
}

export function applyLearnListingFilters(
  items: Array<LearningItem>,
  rowsById: Map<number, LearningEntityRow>,
  filters: BatchLearningFiltersInput | undefined,
  nowMs: number,
): Array<LearningItem> {
  if (filters == null) return items

  return items.filter((item) => {
    const row = rowsById.get(item.id)

    const moduleMatch =
      filters.modules == null ||
      filters.modules.length === 0 ||
      filters.modules.includes(item.moduleName)

    const categoryMatch =
      filters.categories == null ||
      filters.categories.length === 0 ||
      filters.categories.includes(item.category)

    const typeMatch =
      filters.types == null || filters.types.length === 0 || filters.types.includes(item.type)

    const priorityMatch =
      filters.priorities == null ||
      filters.priorities.length === 0 ||
      filters.priorities.includes(item.isOptional)

    const instructorMatch =
      filters.instructors == null ||
      filters.instructors.length === 0 ||
      filters.instructors.includes(item.hostName)

    const scheduleMatch = matchesScheduleBounds(
      item.scheduleDate,
      filters.scheduleStartDate,
      filters.scheduleEndDate,
    )

    const phaseMatch =
      row == null ||
      item.learningType === 'assignment' ||
      matchesSchedulePhase(row, filters.schedulePhase, nowMs)

    const attendanceMatch =
      item.learningType !== 'lecture' ||
      matchesAttendance(item.attendance, filters.attendanceStatus)

    const progressMatch =
      item.learningType !== 'assignment' ||
      matchesAssignmentProgress(
        item.assignmentProgressStatus,
        filters.assignmentProgressStatuses,
      )

    return (
      moduleMatch &&
      categoryMatch &&
      typeMatch &&
      priorityMatch &&
      instructorMatch &&
      scheduleMatch &&
      phaseMatch &&
      attendanceMatch &&
      progressMatch
    )
  })
}
