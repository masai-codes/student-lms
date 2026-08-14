import { ArrowClockwise, CalendarBlank } from '@phosphor-icons/react'

/** Shimmer placeholder mirroring the toolbar + grid while events load. */
export function CalendarSkeleton() {
  return (
    <div data-testid="my-calendar-skeleton" className="space-y-3">
      <span className="sr-only">Loading calendar…</span>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="dash-skeleton h-9 w-44 rounded-lg" />
        <div className="flex gap-2">
          <div className="dash-skeleton h-9 w-28 rounded-lg" />
          <div className="dash-skeleton h-9 w-36 rounded-lg" />
        </div>
      </div>
      <div className="dash-skeleton h-[560px] w-full rounded-2xl" />
    </div>
  )
}

/** Friendly empty grid message — the old LMS just showed a blank grid. */
export function CalendarEmptyState() {
  return (
    <div
      data-testid="my-calendar-empty"
      className="pointer-events-none absolute inset-x-0 top-24 z-10 flex flex-col items-center gap-2 text-center"
    >
      <CalendarBlank
        aria-hidden
        weight="duotone"
        className="animate-dash-float size-10 text-foreground-subtle"
      />
      <p className="text-sm font-medium text-foreground-muted">
        Nothing scheduled here
      </p>
      <p className="text-xs text-foreground-subtle">
        Try another week or switch the batch filter.
      </p>
    </div>
  )
}

/** Error card with a retry — the old LMS said "refresh the page" and stopped. */
export function CalendarErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      data-testid="my-calendar-error"
      className="animate-dash-rise flex h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-center"
    >
      <p className="text-sm font-medium text-foreground">
        Couldn&apos;t load your calendar
      </p>
      <p className="text-xs text-foreground-muted">
        Something went wrong on our side. Give it another go.
      </p>
      <button
        type="button"
        data-testid="my-calendar-retry"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95"
      >
        <ArrowClockwise aria-hidden className="size-3.5" />
        Retry
      </button>
    </div>
  )
}
