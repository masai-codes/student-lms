import { CALENDAR_TYPE_STYLES } from '@/lib/calendar/calendarColors'
import { cn } from '@/lib/utils'

/**
 * Stable color key for the three event types — the old LMS had no legend (and
 * its colors alternated by index, so one couldn't have existed).
 */
export function CalendarLegend({ className }: { className?: string }) {
  return (
    <div
      data-testid="my-calendar-legend"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted',
        className,
      )}
    >
      {CALENDAR_TYPE_STYLES.map((style) => (
        <span
          key={style.type}
          data-testid={`my-calendar-legend-${style.type}`}
          className="inline-flex items-center gap-1.5"
        >
          <span
            aria-hidden
            className={cn('size-2 rounded-full', style.dotClass)}
          />
          {style.label}
        </span>
      ))}
    </div>
  )
}
