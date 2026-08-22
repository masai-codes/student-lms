import { useMemo } from 'react'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { getLectureAttendanceRender } from '@/lib/lecture-attendance/getLectureAttendanceRender'
import type { LectureAttendanceRender } from '@/lib/lecture-attendance/types'

/**
 * Memoized wrapper over `getLectureAttendanceRender` — the one resolver shared
 * by the /learn listing card and the lecture detail header. The detail page
 * passes the live player's `watchPercentage` so the badge updates mid-watch.
 */
export function useLectureAttendancePresentation(
  attendance: LectureAttendanceSummary | null | undefined,
  watchPercentage?: number | null,
): LectureAttendanceRender {
  return useMemo(
    () => getLectureAttendanceRender(attendance, { watchPercentage }),
    [attendance, watchPercentage],
  )
}
