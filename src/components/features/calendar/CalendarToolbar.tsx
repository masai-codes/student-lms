import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import type { CalendarBatchOption } from '@/server/api/calendar/calendarTypes'
import type { CalendarView } from '@/lib/calendar/calendarSearch'
import { CalendarLegend } from './CalendarLegend'
import { pushCalendarEvent } from './calendarAnalytics'
import { MasaiSelectDropdown } from '@/components/ui/masai-select-dropdown'
import { cn } from '@/lib/utils'

const NAV_BUTTON_CLASS =
  'inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition-all duration-150 ease-out hover:-translate-y-px hover:border-brand/35 hover:text-foreground active:scale-95'

interface CalendarToolbarProps {
  title: string
  view: CalendarView
  availableViews: Array<CalendarView>
  onViewChange: (view: CalendarView) => void
  onNavigate: (action: 'today' | 'prev' | 'next') => void
  batches: Array<CalendarBatchOption>
  batchId: number | undefined
  onBatchChange: (batchId: number | undefined) => void
  /** Extra actions rendered at the end of the controls row (e.g. Subscribe). */
  children?: React.ReactNode
}

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
}

/** Our own toolbar (react-big-calendar's is disabled): title + Today/arrows + view switch + batch filter + legend. */
export function CalendarToolbar(props: CalendarToolbarProps) {
  const { title, view, availableViews, batches, batchId } = props

  const handleNavigate = (action: 'today' | 'prev' | 'next') => {
    pushCalendarEvent(`l_calendar_navigate_${action}`, { view })
    props.onNavigate(action)
  }

  const batchOptions = [
    { value: 'all', label: 'All batches' },
    ...batches.map((batch) => ({ value: String(batch.id), label: batch.name })),
  ]

  return (
    <div
      data-testid="my-calendar-toolbar"
      className="animate-dash-rise space-y-2"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            data-testid="my-calendar-today"
            onClick={() => handleNavigate('today')}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-all duration-150 ease-out hover:-translate-y-px hover:border-brand/35 active:scale-95"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous"
            data-testid="my-calendar-prev"
            onClick={() => handleNavigate('prev')}
            className={NAV_BUTTON_CLASS}
          >
            <CaretLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            data-testid="my-calendar-next"
            onClick={() => handleNavigate('next')}
            className={NAV_BUTTON_CLASS}
          >
            <CaretRight aria-hidden className="size-4" />
          </button>
          <h1
            data-testid="my-calendar-title"
            className="min-w-0 truncate text-lg font-semibold text-foreground"
          >
            {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Calendar view"
            className="inline-flex rounded-lg border border-border bg-surface p-0.5"
          >
            {availableViews.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={view === candidate}
                data-testid={`my-calendar-view-${candidate}`}
                onClick={() => {
                  pushCalendarEvent(`l_calendar_view_${candidate}`, {})
                  props.onViewChange(candidate)
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
                  view === candidate
                    ? 'bg-brand text-brand-foreground'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                {VIEW_LABELS[candidate]}
              </button>
            ))}
          </div>

          {batches.length > 1 ? (
            <div data-testid="my-calendar-batch-filter">
              <MasaiSelectDropdown
                aria-label="Filter by batch"
                options={batchOptions}
                value={batchId != null ? String(batchId) : 'all'}
                onValueChange={(value) => {
                  const next = value === 'all' ? undefined : Number(value)
                  pushCalendarEvent('l_calendar_batch_filter', {
                    batch_id: next ?? 'all',
                  })
                  props.onBatchChange(next)
                }}
                chevronVariant="plain"
                triggerClassName="min-h-9 min-w-[140px] rounded-lg px-3 py-1 text-xs"
              />
            </div>
          ) : null}
          {props.children}
        </div>
      </div>
      <CalendarLegend />
    </div>
  )
}
