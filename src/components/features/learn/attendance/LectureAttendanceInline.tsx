import { LectureAttendanceStatusBadge } from './LectureAttendanceStatusBadge'

import type { ListingAttendanceRender } from '@/lib/lecture-attendance/types'

type LectureAttendanceInlineProps = ListingAttendanceRender

export function LectureAttendanceInline({
  uiState,
  daysRemaining,
  remainingLabel,
  showBadge = true,
}: LectureAttendanceInlineProps) {
  if (uiState == null) {
    return null
  }

  const showDays = daysRemaining != null && daysRemaining >= 0

  return (
    <div className="flex min-w-0 flex-col items-end gap-1 md:flex-row md:items-center md:gap-2">
      {showDays ? (
        <span className="type-t1 whitespace-nowrap text-gray-500">
          {remainingLabel ?? `${daysRemaining} days remaining`}
        </span>
      ) : null}
      {showBadge ? (
        <div className="min-w-0 shrink">
          <LectureAttendanceStatusBadge state={uiState} />
        </div>
      ) : null}
    </div>
  )
}
