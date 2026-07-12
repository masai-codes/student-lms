import type { ReactNode } from 'react'

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
}

/** Present hover: Live / Recording / Overall attendance breakdown (mirrors old LMS). */
function PresentTooltipContent({
  attendance,
}: {
  attendance: LectureAttendanceSummary
}) {
  const isPresent = attendance.overallStatus === 1
  const liveStatus =
    attendance.liveAttendanceStatus === 1 ? 'Attended' : 'Not Attended'
  const videoStatus =
    attendance.videoAttendanceStatus === 1 ? 'Watched' : 'Not Watched'

  if (!attendance.includeVideoAttendance) {
    return <p className="italic">Only live class attendance is considered.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div>Live - {liveStatus}</div>
      <div>Recording - {videoStatus}</div>
      <div>
        <span
          className={
            isPresent
              ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 type-t1 font-medium text-emerald-700'
              : 'inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 type-t1 font-medium text-rose-600'
          }
        >
          Overall - {isPresent ? 'Present' : 'Absent'}
        </span>
      </div>
    </div>
  )
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
      You have not joined this session using your Zoom authenticated mail id with
      Masai
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
  ...render
}: LectureAttendanceDetailBadgeProps) {
  const remainingText = formatCatchUpRemainingLabel(
    render.remainingLabel,
    render.daysRemaining,
  )

  // Reuse LectureAttendanceInline for layout/label/badge; only wrap the badge
  // with the detail-page hover tooltips here.
  return (
    <LectureAttendanceInline
      {...render}
      renderBadge={(badge) => {
        if (render.uiState === 'present') {
          return withTooltip(
            <PresentTooltipContent attendance={attendance} />,
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
