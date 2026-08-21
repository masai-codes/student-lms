import { CheckCircle, PlayCircle, Timer, XCircle } from '@phosphor-icons/react'

import { LECTURE_ATTENDANCE_STATUS_META } from '@/lib/lecture-attendance/lectureAttendanceStatus'
import type { ListingAttendanceVisibleState } from '@/lib/lecture-attendance/types'
import { cn } from '@/lib/utils'

type LectureAttendanceStatusBadgeProps = {
  state: ListingAttendanceVisibleState
  /**
   * `batches.is_attendance_mandatory = 0`: worded Present/Absent badges render
   * as a bare green tick / red cross instead (Continue Watching keeps its
   * wording — see `LECTURE_ATTENDANCE_STATUS_META`). Screen readers still get
   * the full label.
   */
  iconOnly?: boolean
  className?: string
}

const badgeBase =
  'inline-flex items-center gap-1 rounded-full px-2 py-1 type-t1 font-medium'

export function LectureAttendanceStatusBadge({
  state,
  iconOnly = false,
  className,
}: LectureAttendanceStatusBadgeProps) {
  const meta = LECTURE_ATTENDANCE_STATUS_META[state]

  if (iconOnly && meta.iconOnlyWhenAttendanceOptional) {
    const isPresent = state === 'present'
    const Icon = isPresent ? CheckCircle : XCircle
    return (
      <span
        data-testid="lecture-attendance-icon-badge"
        className={cn(
          'inline-flex items-center rounded-full p-1',
          isPresent
            ? 'bg-success-subtle text-success-subtle-foreground'
            : 'bg-danger-subtle text-danger-subtle-foreground',
          className,
        )}
        aria-label={meta.label}
        title={meta.label}
      >
        <Icon weight="fill" className="size-[18px] shrink-0" aria-hidden />
      </span>
    )
  }

  if (state === 'present') {
    return (
      <span
        className={cn(
          badgeBase,
          'bg-success-subtle text-success-subtle-foreground',
          className,
        )}
        aria-label={meta.label}
      >
        <CheckCircle
          weight="fill"
          className="size-[18px] shrink-0"
          aria-hidden
        />
        <span className="capitalize">{meta.label}</span>
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
        aria-label={meta.label}
      >
        <XCircle weight="fill" className="size-[18px] shrink-0" aria-hidden />
        <span className="capitalize">{meta.label}</span>
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
        aria-label={meta.label}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand">
          <PlayCircle
            weight="fill"
            className="size-4 text-brand-foreground"
            aria-hidden
          />
        </span>
        {/* Wraps below `sm` so the badge can't force 320px viewports to scroll. */}
        <span className="sm:whitespace-nowrap">{meta.label}</span>
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
      aria-label={meta.label}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger">
        <Timer
          weight="bold"
          className="size-3 text-danger-foreground"
          aria-hidden
        />
      </span>
      {/* Wraps below `sm` so the badge can't force 320px viewports to scroll. */}
      <span className="sm:whitespace-nowrap">{meta.label}</span>
    </span>
  )
}
