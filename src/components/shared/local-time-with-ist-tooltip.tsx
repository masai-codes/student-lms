'use client'

import { cn } from '@/lib/utils'
import { isIstTimezone } from '@/utils/timeZoneHandler'

type LocalTimeWithIstTooltipProps = {
  /** The time string in the viewer's local timezone (usually ends with "(TZ)"). */
  local: string | null | undefined
  /** The same time in IST, shown on hover. Ends with "(IST)". */
  ist: string | null | undefined
  /** Shown when `local` is empty. */
  fallback?: string
  /** Extra classes for the wrapping element. */
  className?: string
}

/**
 * Renders a time in the viewer's local timezone and, when that timezone is not
 * IST, reveals the IST equivalent in a hover tooltip. DB times are IST
 * wall-clock, so an IST viewer already sees IST — no tooltip is rendered then.
 *
 * The two strings are precomputed by the caller (e.g. `formatScheduleRangeLocal`
 * / `formatScheduleRangeIST`) so this component stays presentation-only.
 */
export function LocalTimeWithIstTooltip({
  local,
  ist,
  fallback = 'No schedule',
  className,
}: LocalTimeWithIstTooltipProps) {
  const text = local || fallback
  const showTooltip = Boolean(local) && Boolean(ist) && !isIstTimezone()

  if (!showTooltip) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={cn('relative group/ist-time cursor-default', className)}>
      {text}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5
          whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs
          font-medium text-white opacity-0 shadow-lg transition-opacity
          duration-150 group-hover/ist-time:opacity-100"
      >
        {ist}
        <span className="absolute left-4 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}
