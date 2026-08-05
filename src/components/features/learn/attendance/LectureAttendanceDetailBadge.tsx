import type { ReactNode } from 'react'

import { AttendanceBreakdownContent } from './AttendanceBreakdownContent'
import { LectureAttendanceInline } from './LectureAttendanceInline'

import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { ListingAttendanceRender } from '@/lib/lecture-attendance/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type LectureAttendanceDetailBadgeProps = ListingAttendanceRender & {
  attendance: LectureAttendanceSummary
  /** `live`/`scrum` lectures show the Live line in the breakdown; video omits it. */
  isLiveLecture: boolean
}

/** Absent hover: explains why the student was marked absent (mirrors old LMS). */
function AbsentTooltipContent({
  attendance,
  remainingText,
}: {
  attendance: LectureAttendanceSummary
  remainingText: string | null
}) {
  const lateMins = attendance.lateByMinutes ?? 0
  const isLateWithinWindow = lateMins > 0 && remainingText != null

  if (isLateWithinWindow) {
    // Reuse the exact countdown label the card shows so both surfaces agree.
    return (
      <ul className="list-outside list-disc space-y-2 pl-3.5">
        <li>
          You have joined this session late by {lateMins} mins. Yet you can
          claim attendance if you watch this lecture in time — {remainingText}
        </li>
        <li>
          You need to watch Entire Recording of this session to claim your
          attendance
        </li>
      </ul>
    )
  }

  return (
    <p>
      You have not joined this session
    </p>
  )
}

function withTooltip(content: ReactNode, badge: ReactNode): ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{content}</TooltipContent>
    </Tooltip>
  )
}

export function LectureAttendanceDetailBadge({
  attendance,
  isLiveLecture,
  ...render
}: LectureAttendanceDetailBadgeProps) {
  const remainingText = formatCatchUpRemainingLabel(render.daysRemaining)

  // Reuse LectureAttendanceInline for layout/label/badge; only wrap the badge
  // with the detail-page hover tooltips here.
  return (
    <LectureAttendanceInline
      {...render}
      renderBadge={(badge) => {
        if (render.uiState === 'present') {
          return withTooltip(
            <AttendanceBreakdownContent
              attendance={attendance}
              isLiveLecture={isLiveLecture}
            />,
            badge,
          )
        }
        if (render.uiState === 'absent') {
          return withTooltip(
            <AbsentTooltipContent
              attendance={attendance}
              remainingText={remainingText}
            />,
            badge,
          )
        }
        return badge
      }}
    />
  )
}
