import { CheckCircle, PlayCircle, Timer, XCircle } from '@phosphor-icons/react'

import type { ListingAttendanceVisibleState } from '@/lib/lecture-attendance/types'
import { cn } from '@/lib/utils'

type LectureAttendanceStatusBadgeProps = {
  state: ListingAttendanceVisibleState
  className?: string
}

const badgeBase =
  'inline-flex items-center gap-1 rounded-full px-2 py-1 type-t1 font-medium'

export function LectureAttendanceStatusBadge({
  state,
  className,
}: LectureAttendanceStatusBadgeProps) {
  if (state === 'present') {
    return (
      <span
        className={cn(badgeBase, 'text-emerald-700 md:bg-emerald-100', className)}
        aria-label="Present"
      >
        <CheckCircle weight="fill" className="size-[18px] shrink-0" aria-hidden />
        <span className="hidden capitalize md:inline">Present</span>
      </span>
    )
  }

  if (state === 'absent') {
    return (
      <span
        className={cn(badgeBase, 'text-rose-600 md:bg-rose-100', className)}
        aria-label="Absent"
      >
        <XCircle weight="fill" className="size-[18px] shrink-0" aria-hidden />
        <span className="hidden capitalize md:inline">Absent</span>
      </span>
    )
  }

  if (state === 'continue_watching') {
    return (
      <span
        className={cn(
          badgeBase,
          'gap-2 text-primary-600 md:bg-primary-50 md:pr-2.5',
          className,
        )}
        aria-label="Continue watching"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full md:bg-primary-600">
          <PlayCircle
            weight="fill"
            className="size-4 text-primary-600 md:text-white"
            aria-hidden
          />
        </span>
        <span className="hidden md:inline">Continue Watching</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        badgeBase,
        'gap-1.5 text-teal-700 md:bg-teal-50 md:pr-2.5',
        className,
      )}
      aria-label="Attendance window over"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full md:bg-teal-700">
        <Timer weight="bold" className="size-3 text-teal-700 md:text-white" aria-hidden />
      </span>
      <span className="hidden md:inline">Att. Window Over</span>
    </span>
  )
}
