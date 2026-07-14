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
        className={cn(badgeBase, 'bg-emerald-100 text-emerald-700', className)}
        aria-label="Present"
      >
        <CheckCircle
          weight="fill"
          className="size-[18px] shrink-0"
          aria-hidden
        />
        <span className="capitalize">Present</span>
      </span>
    )
  }

  if (state === 'absent') {
    return (
      <span
        className={cn(badgeBase, 'bg-rose-100 text-rose-600', className)}
        aria-label="Absent"
      >
        <XCircle weight="fill" className="size-[18px] shrink-0" aria-hidden />
        <span className="capitalize">Absent</span>
      </span>
    )
  }

  if (state === 'continue_watching') {
    return (
      <span
        className={cn(
          badgeBase,
          'gap-2 bg-primary-50 pr-2.5 text-primary-600',
          className,
        )}
        aria-label="Continue watching"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-600">
          <PlayCircle weight="fill" className="size-4 text-white" aria-hidden />
        </span>
        {/* Wraps below `sm` so the badge can't force 320px viewports to scroll. */}
        <span className="sm:whitespace-nowrap">Continue Watching</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        badgeBase,
        'gap-1.5 bg-rose-100 pr-2.5 text-rose-600',
        className,
      )}
      aria-label="Absent and attendance window over"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-600">
        <Timer weight="bold" className="size-3 text-white" aria-hidden />
      </span>
      {/* Wraps below `sm` so the badge can't force 320px viewports to scroll. */}
      <span className="sm:whitespace-nowrap">Absent and Att. Window Over</span>
    </span>
  )
}
