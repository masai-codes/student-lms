import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  AssignmentListingStatusChip,
  LearnListingCardCtas,
  LearnListingJoinLiveState,
} from '@/server/learn/types'
import { getLectureAttendanceRender } from '@/lib/lecture-attendance/getLectureAttendanceRender'
import type { LectureAttendanceRender } from '@/lib/lecture-attendance/types'

/**
 * Frontend presentation for learn listing card CTAs.
 * Server rules live in `buildLearnListingCardCtas` — this file only maps them to UI state.
 */
export function getLearnListingAttendancePresentation(
  listingCtas: LearnListingCardCtas,
  attendance: LectureAttendanceSummary | null | undefined,
): LectureAttendanceRender | null {
  if (!listingCtas.showAttendance) {
    return null
  }

  const render = getLectureAttendanceRender(attendance)
  if (render.uiState == null) {
    return null
  }

  return render
}

export function shouldShowJoinLiveCta(
  joinLive: LearnListingJoinLiveState,
): boolean {
  return joinLive !== 'hidden'
}

export function getJoinLiveCtaTheme(
  joinLive: LearnListingJoinLiveState,
): 'red' | 'yellow' {
  return joinLive === 'active' ? 'red' : 'yellow'
}

export function shouldShowAssignmentStatusChip(
  chip: AssignmentListingStatusChip,
): chip is Exclude<AssignmentListingStatusChip, null> {
  return chip != null
}
