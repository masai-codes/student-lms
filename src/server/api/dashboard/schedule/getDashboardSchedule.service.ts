import { getScheduleDateWindow } from './scheduleWindow'
import { fetchScheduleLectures } from './fetchScheduleLectures.service'
import { fetchScheduleAssignments } from './fetchScheduleAssignments.service'
import { buildDashboardScheduleItem } from './buildDashboardScheduleItem'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { DashboardScheduleItem, ScheduleEntityRow } from './scheduleTypes'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getBatchIdsForSections } from '@/server/batches/getBatchIdsForSections'
import { getUserBatchBans, makeNormalBanScheduleFilter } from '@/server/users/batchBan'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { fetchLatestSubmissionByAssignment } from '@/server/learn/queries/fetchLatestSubmissionByAssignment'

/**
 * Everything happening in the user's sections over the next 7 days — lectures +
 * assignments merged into one schedule feed, newest-scheduled first excluded
 * (soonest first). Reuses the learn listing mappers/CTA builder/attendance so
 * the same card renders these rows. Filters on `start_date`/`end_date`, returns
 * `schedule`/`concludes` for display. Normal-ban: rows scheduled after the user's
 * ban date in a banned batch are dropped.
 */
export async function getDashboardSchedule(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardScheduleItem>> {
  const nowMs = now.getTime()
  const { start, end } = getScheduleDateWindow(now)

  const [sectionIds, batchIds, bans] = await Promise.all([
    getSectionIdsForUser(userId),
    getBatchIdsForEnrolledUser(userId),
    getUserBatchBans(userId),
  ])
  if (sectionIds.length === 0) return []

  const [lectureRows, assignmentRows] = await Promise.all([
    fetchScheduleLectures(sectionIds, start, end),
    fetchScheduleAssignments(sectionIds, start, end),
  ])

  let visibleLectures = lectureRows
  let visibleAssignments = assignmentRows
  if (bans.normalByBatch.size > 0) {
    const sectionToBatch = await getBatchIdsForSections(sectionIds)
    const keep = makeNormalBanScheduleFilter(bans.normalByBatch, sectionToBatch)
    visibleLectures = lectureRows.filter(keep)
    visibleAssignments = assignmentRows.filter(keep)
  }

  const attendance = await fetchLectureAttendanceSummaries(
    userId,
    visibleLectures
      .filter((row): row is ScheduleEntityRow & { sectionId: number } => row.sectionId != null)
      .map((row) => ({
        lectureId: row.id,
        sectionId: row.sectionId,
        schedule: row.schedule,
        concludes: row.concludes ?? null,
        optional: row.optional,
      })),
  )

  const submissionByAssignment = await fetchLatestSubmissionByAssignment(
    userId,
    visibleAssignments.map((row) => row.id),
  )
  const assignmentProgress = (row: ScheduleEntityRow): AssignmentProgressStatus =>
    calculateAssignmentProgressStatus({
      schedule: row.schedule,
      concludes: row.concludes ?? null,
      nowMs,
      submission: submissionByAssignment.get(row.id) ?? null,
    })

  const showCourseName = batchIds.length > 1

  const items = [
    ...visibleLectures.map((row) =>
      buildDashboardScheduleItem({
        row,
        learningType: 'lecture',
        nowMs,
        attendance: attendance.get(row.id) ?? null,
        assignmentProgressStatus: null,
        showCourseName,
      }),
    ),
    ...visibleAssignments.map((row) =>
      buildDashboardScheduleItem({
        row,
        learningType: 'assignment',
        nowMs,
        attendance: null,
        assignmentProgressStatus: assignmentProgress(row),
        showCourseName,
      }),
    ),
  ]

  return items.sort(bySoonestSchedule)
}

/** Soonest schedule first; rows without a schedule sink to the end. */
function bySoonestSchedule(a: DashboardScheduleItem, b: DashboardScheduleItem): number {
  return toTime(a.scheduleDate) - toTime(b.scheduleDate)
}

function toTime(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value.includes('T') ? value : value.replace(' ', 'T')).getTime()
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}
