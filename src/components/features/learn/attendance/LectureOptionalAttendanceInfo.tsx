import { Info } from 'lucide-react'

import { AttendanceBreakdownContent } from './AttendanceBreakdownContent'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type LectureOptionalAttendanceInfoProps = {
  attendance: LectureAttendanceSummary
  /** `live`/`scrum` lectures show the Live line in the breakdown; video omits it. */
  isLiveLecture: boolean
  /** `md` bumps the icon for the detail-page title row; `sm` (default) for cards. */
  size?: 'sm' | 'md'
}

/**
 * Info (i) icon shown beside an optional-session tag/title. On hover it reveals
 * the Live / Recording / Overall attendance breakdown. Optional lectures never
 * show the regular attendance badge, so this is the only surface where a student
 * can see whether their optional-session attendance was recorded.
 */
export function LectureOptionalAttendanceInfo({
  attendance,
  isLiveLecture,
  size = 'sm',
}: LectureOptionalAttendanceInfoProps) {
  const iconSize = size === 'md' ? 18 : 16

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Attendance status"
          className="inline-flex shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info width={iconSize} height={iconSize} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <AttendanceBreakdownContent
          attendance={attendance}
          isLiveLecture={isLiveLecture}
        />
      </TooltipContent>
    </Tooltip>
  )
}
