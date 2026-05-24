import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  AssignmentListingStatusChip,
  LearnListingCardCtas,
  LearnListingJoinLiveState,
} from '@/server/learn/types'
import { getListingAttendanceRender } from '@/lib/lecture-attendance/getListingAttendanceRender'
import type { ListingAttendanceRender } from '@/lib/lecture-attendance/types'

/**
 * Frontend presentation for learn listing card CTAs.
 * Server rules live in `buildLearnListingCardCtas` — this file only maps them to UI state.
 */
export function getLearnListingAttendancePresentation(
  listingCtas: LearnListingCardCtas,
  attendance: LectureAttendanceSummary | null | undefined,
): ListingAttendanceRender | null {
  if (!listingCtas.showAttendance) {
    return null
  }

  const render = getListingAttendanceRender(attendance)
  if (render.uiState == null) {
    return null
  }

  return render
}

export function shouldShowJoinLiveCta(joinLive: LearnListingJoinLiveState): boolean {
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
