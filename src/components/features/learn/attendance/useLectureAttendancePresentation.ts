import { useMemo } from 'react'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { mapAttendanceSummaryToDetailUiState } from '@/lib/lecture-attendance/mapAttendanceSummaryToUi'
import { getListingAttendanceRender } from '@/lib/lecture-attendance/getListingAttendanceRender'
import type {
  ListingAttendanceRender,
  LectureAttendanceUiState,
} from '@/lib/lecture-attendance/types'

export function useListingAttendancePresentation(
  attendance: LectureAttendanceSummary | null | undefined,
  watchPercentage?: number | null,
): ListingAttendanceRender {
  return useMemo(
    () => getListingAttendanceRender(attendance, { watchPercentage }),
    [attendance, watchPercentage],
  )
}

function useDetailAttendanceUiState(
  attendance: LectureAttendanceSummary | null | undefined,
  watchPercentage?: number | null,
): LectureAttendanceUiState | null {
  return useMemo(
    () => mapAttendanceSummaryToDetailUiState(attendance, watchPercentage),
    [attendance, watchPercentage],
  )
}
