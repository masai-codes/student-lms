import type { ReactNode } from 'react'

import { LectureAttendanceHoverContent } from './LectureAttendanceHoverContent'
import { LectureAttendanceStatusBadge } from './LectureAttendanceStatusBadge'

import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import type { LectureAttendanceRender } from '@/lib/lecture-attendance/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { showsCatchUpCountdown } from '@/utils/portal'

type LectureAttendanceInlineProps = LectureAttendanceRender & {
  /**
   * Enables the hover tooltip (catch-up message / Live+Video breakdown — see
   * `LectureAttendanceHoverContent`). Pass the summary the render was built
   * from; omit only where no hover surface makes sense.
   */
  attendance?: LectureAttendanceSummary | null
  /** `live`/`scrum` lecture — shows the "Live:" line in the hover breakdown. */
  isLiveLecture?: boolean
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
  iconOnly = false,
  attendance,
  isLiveLecture = false,
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

  const withHover = (trigger: ReactNode): ReactNode => {
    if (attendance == null) {
      return trigger
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <LectureAttendanceHoverContent
            attendance={attendance}
            isLiveLecture={isLiveLecture}
            uiState={uiState}
            daysRemaining={daysRemaining}
            iconOnly={iconOnly}
          />
        </TooltipContent>
      </Tooltip>
    )
  }

  const badge = showBadge ? (
    <div className="min-w-0 shrink">
      <LectureAttendanceStatusBadge state={uiState} iconOnly={iconOnly} />
    </div>
  ) : null

  const daysLabel = showDays ? (
    <span className="type-t1 whitespace-nowrap text-foreground-muted">
      {remainingText}
    </span>
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
      {/* When only the countdown is visible (no badge yet — no attendance row,
          window open) the hover moves onto the countdown text itself. */}
      {daysLabel ? (badge ? daysLabel : withHover(daysLabel)) : null}
      {badge ? withHover(badge) : null}
    </div>
  )
}
