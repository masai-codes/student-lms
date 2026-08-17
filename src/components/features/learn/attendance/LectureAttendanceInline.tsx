import type { ReactNode } from 'react'

import { LectureAttendanceStatusBadge } from './LectureAttendanceStatusBadge'

import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import type { ListingAttendanceRender } from '@/lib/lecture-attendance/types'
import { cn } from '@/lib/utils'
import { showsCatchUpCountdown } from '@/utils/portal'

type LectureAttendanceInlineProps = ListingAttendanceRender & {
  /**
   * Optional wrapper around the rendered badge — used by the lecture-detail
   * variant to add hover tooltips without duplicating this layout/label logic.
   */
  renderBadge?: (badge: ReactNode) => ReactNode
  /**
   * Keep the days label + badge on one row regardless of viewport. Used by the
   * associated-content card, which renders in a narrow drawer where the default
   * mobile column layout would stack them.
   */
  forceRow?: boolean
}

export function LectureAttendanceInline({
  uiState,
  daysRemaining,
  showBadge = true,
  renderBadge,
  forceRow = false,
}: LectureAttendanceInlineProps) {
  if (uiState == null) {
    return null
  }

  // Portals that hide the catch-up countdown drop the label entirely — only the
  // badge remains (see `showsCatchUpCountdown`).
  const showDays =
    daysRemaining != null && daysRemaining >= 0 && showsCatchUpCountdown()
  const remainingText = formatCatchUpRemainingLabel(daysRemaining)

  const badge = showBadge ? (
    <div className="min-w-0 shrink">
      <LectureAttendanceStatusBadge state={uiState} />
    </div>
  ) : null

  return (
    <div
      className={cn(
        'flex min-w-0 gap-1',
        forceRow
          ? 'flex-row items-center gap-2'
          : 'flex-col items-end md:flex-row md:items-center md:gap-2',
      )}
    >
      {showDays ? (
        <span className="type-t1 whitespace-nowrap text-foreground-muted">
          {remainingText}
        </span>
      ) : null}
      {badge ? (renderBadge ? renderBadge(badge) : badge) : null}
    </div>
  )
}
