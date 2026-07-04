import { buildDashboardScheduleItem } from '../schedule/buildDashboardScheduleItem'
import { fetchPendingAssignments } from './fetchPendingAssignments'
import { fetchPendingLectures } from './fetchPendingLectures'
import { fetchAssignmentStartState } from './fetchAssignmentStartState'
import type { DashboardScheduleItem, ScheduleEntityRow } from '../schedule/scheduleTypes'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getBannedContentCutoffForUser } from '@/server/users/getBannedContentCutoffForUser'
import { isContentWithinBannedCutoff } from '@/server/users/bannedContent'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { computeDeadlineCountdown } from '@/server/learn/utils/computeDeadlineCountdown'
import { fetchLatestSubmissionByAssignment } from '@/server/learn/queries/fetchLatestSubmissionByAssignment'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The "Pending Tasks" feed: open assignments the user hasn't begun, plus
 * mandatory lectures they still have an open catch-up window to watch. Both are
 * scoped to the user's sections, banned-cutoff gated, and rendered by the reused
 * learn card. Assignments come first (soonest deadline), then catch-up lectures.
 */
export async function getDashboardPendingTasks(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardScheduleItem>> {
  const nowMs = now.getTime()
  const istNow = getIstNowSqlDatetime(now)

  const [sectionIds, batchIds, cutoff] = await Promise.all([
    getSectionIdsForUser(userId),
    getBatchIdsForEnrolledUser(userId),
    getBannedContentCutoffForUser(userId),
  ])
  if (sectionIds.length === 0) return []

  const withinCutoff = (row: ScheduleEntityRow) =>
    isContentWithinBannedCutoff({ createdAt: null, startDate: row.schedule }, cutoff)
  const showCourseName = batchIds.length > 1

  const [assignmentCandidates, lectureCandidates] = await Promise.all([
    fetchPendingAssignments(sectionIds, istNow),
    fetchPendingLectures(sectionIds, istNow),
  ])

  const assignmentItems = await resolvePendingAssignments(
    userId,
    assignmentCandidates.filter(withinCutoff),
    nowMs,
    showCourseName,
  )
  const lectureItems = await resolvePendingLectures(
    userId,
    lectureCandidates.filter(withinCutoff),
    nowMs,
    showCourseName,
  )

  // Most urgent first — least time remaining on top (assignments by deadline,
  // catch-up lectures by their remaining window), regardless of type.
  return [...assignmentItems, ...lectureItems].sort(
    (a, b) => urgencyMs(a, nowMs) - urgencyMs(b, nowMs),
  )
}

/** Milliseconds of time left to act; smaller = more urgent. */
function urgencyMs(item: DashboardScheduleItem, nowMs: number): number {
  if (item.learningType === 'assignment') {
    return computeDeadlineCountdown(item.concludes, nowMs)?.totalMs ?? Number.POSITIVE_INFINITY
  }
  const daysRemaining = item.attendance?.daysRemaining
  return daysRemaining != null ? daysRemaining * DAY_MS : Number.POSITIVE_INFINITY
}

/** Keep only assignments the user hasn't begun (see {@link fetchAssignmentStartState}). */
async function resolvePendingAssignments(
  userId: number,
  candidates: Array<ScheduleEntityRow>,
  nowMs: number,
  showCourseName: boolean,
): Promise<Array<DashboardScheduleItem>> {
  const begun = await fetchAssignmentStartState(
    userId,
    candidates.map((row) => row.id),
  )
  const pending = candidates.filter((row) => !begun.has(row.id))

  const submissionByAssignment = await fetchLatestSubmissionByAssignment(
    userId,
    pending.map((row) => row.id),
  )

  return pending.map((row) =>
    buildDashboardScheduleItem({
      row,
      learningType: 'assignment',
      nowMs,
      attendance: null,
      assignmentProgressStatus: calculateAssignmentProgressStatus({
        schedule: row.schedule,
        concludes: row.concludes ?? null,
        nowMs,
        submission: submissionByAssignment.get(row.id) ?? null,
      }),
      showCourseName,
    }),
  )
}

/** Keep only lectures whose catch-up attendance window is still open. */
async function resolvePendingLectures(
  userId: number,
  candidates: Array<ScheduleEntityRow>,
  nowMs: number,
  showCourseName: boolean,
): Promise<Array<DashboardScheduleItem>> {
  const attendance = await fetchLectureAttendanceSummaries(
    userId,
    candidates
      .filter((row): row is ScheduleEntityRow & { sectionId: number } => row.sectionId != null)
      .map((row) => ({
        lectureId: row.id,
        sectionId: row.sectionId,
        schedule: row.schedule,
        concludes: row.concludes ?? null,
        optional: row.optional,
      })),
    nowMs,
  )

  return candidates
    .filter((row) => attendance.get(row.id)?.isCatchupWindowOver === false)
    .map((row) =>
      buildDashboardScheduleItem({
        row,
        learningType: 'lecture',
        nowMs,
        attendance: attendance.get(row.id) ?? null,
        assignmentProgressStatus: null,
        showCourseName,
      }),
    )
}
