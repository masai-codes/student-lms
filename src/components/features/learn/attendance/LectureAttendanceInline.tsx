import type { ReactNode } from 'react'

import { LectureAttendanceStatusBadge } from './LectureAttendanceStatusBadge'

import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import type { ListingAttendanceRender } from '@/lib/lecture-attendance/types'

type LectureAttendanceInlineProps = ListingAttendanceRender & {
  /**
   * Optional wrapper around the rendered badge — used by the lecture-detail
   * variant to add hover tooltips without duplicating this layout/label logic.
   */
  renderBadge?: (badge: ReactNode) => ReactNode
}

export function LectureAttendanceInline({
  uiState,
  daysRemaining,
  remainingLabel,
  showBadge = true,
  renderBadge,
}: LectureAttendanceInlineProps) {
  if (uiState == null) {
    return null
  }

  const showDays = daysRemaining != null && daysRemaining >= 0
  const remainingText = formatCatchUpRemainingLabel(remainingLabel, daysRemaining)

  const badge = showBadge ? (
    <div className="min-w-0 shrink">
      <LectureAttendanceStatusBadge state={uiState} />
    </div>
  ) : null

  return (
    <div className="flex min-w-0 flex-col items-end gap-1 md:flex-row md:items-center md:gap-2">
      {showDays ? (
        <span className="type-t1 whitespace-nowrap text-gray-500">
          {remainingText}
        </span>
      ) : null}
      {badge ? (renderBadge ? renderBadge(badge) : badge) : null}
    </div>
  )
}
