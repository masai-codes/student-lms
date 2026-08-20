import { CheckCircle, PlayCircle, Timer, XCircle } from '@phosphor-icons/react'

import { ATTENDANCE_STATUS_LABELS } from '@/lib/lecture-attendance/attendanceStatusLabels'
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
  const labels = ATTENDANCE_STATUS_LABELS

  if (state === 'present') {
    return (
      <span
        className={cn(
          badgeBase,
          'bg-success-subtle text-success-subtle-foreground',
          className,
        )}
        aria-label={labels.present}
      >
        <CheckCircle
          weight="fill"
          className="size-[18px] shrink-0"
          aria-hidden
        />
        <span className="capitalize">{labels.present}</span>
      </span>
    )
  }

  if (state === 'absent') {
    return (
      <span
        className={cn(
          badgeBase,
          'bg-danger-subtle text-danger-subtle-foreground',
          className,
        )}
        aria-label={labels.absent}
      >
        <XCircle weight="fill" className="size-[18px] shrink-0" aria-hidden />
        <span className="capitalize">{labels.absent}</span>
      </span>
    )
  }

  if (state === 'continue_watching') {
    return (
      <span
        className={cn(
          badgeBase,
          // `primary-50` is the raw Masai palette (constant across themes);
          // `brand-subtle` matches it in light and re-themes in dark.
          'gap-2 bg-brand-subtle pr-2.5 text-primary-600 dark:text-brand-subtle-foreground',
          className,
        )}
        aria-label="Continue watching"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand">
          <PlayCircle
            weight="fill"
            className="size-4 text-brand-foreground"
            aria-hidden
          />
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
        'gap-1.5 bg-danger-subtle pr-2.5 text-danger-subtle-foreground',
        className,
      )}
      aria-label={labels.attWindowOver}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger">
        <Timer
          weight="bold"
          className="size-3 text-danger-foreground"
          aria-hidden
        />
      </span>
      {/* Wraps below `sm` so the badge can't force 320px viewports to scroll. */}
      <span className="sm:whitespace-nowrap">{labels.attWindowOver}</span>
    </span>
  )
}
