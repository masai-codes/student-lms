export type CalendarView = 'month' | 'week' | 'day'

/**
 * URL state for `/my-calendar`. `date` is a full `YYYY-MM-DD` anchor (unlike
 * the old LMS's month-name param) so a specific week or day deep-links.
 * Defaults (week view, today, all batches) are omitted to keep URLs clean.
 */
export type CalendarRouteSearch = {
  view?: CalendarView
  date?: string
  batchId?: number
}

export const DEFAULT_CALENDAR_VIEW: CalendarView = 'week'

const VIEWS = new Set<CalendarView>(['month', 'week', 'day'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseCalendarView(value: unknown): CalendarView | undefined {
  if (typeof value !== 'string' || !VIEWS.has(value as CalendarView)) {
    return undefined
  }
  const view = value as CalendarView
  return view === DEFAULT_CALENDAR_VIEW ? undefined : view
}

function parseCalendarDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return undefined
  const ms = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(ms)) return undefined
  // Reject rollover dates like 2026-02-31.
  if (new Date(ms).toISOString().slice(0, 10) !== value) return undefined
  return value
}

function parsePositiveInt(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return Math.trunc(parsed)
}

export function parseCalendarSearch(
  search: Record<string, unknown>,
): CalendarRouteSearch {
  return {
    view: parseCalendarView(search.view),
    date: parseCalendarDate(search.date),
    batchId: parsePositiveInt(search.batchId),
  }
}
