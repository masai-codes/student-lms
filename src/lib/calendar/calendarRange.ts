import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { CalendarView } from './calendarSearch'

/** Inclusive `YYYY-MM-DD` bounds of the visible grid, in the viewer's local days. */
export interface CalendarVisibleRange {
  start: string
  end: string
}

/** The anchor as a local dayjs; invalid/absent values resolve to today. */
export function anchorDay(date: string | undefined): Dayjs {
  const parsed = date ? dayjs(date) : dayjs()
  return parsed.isValid() ? parsed.startOf('day') : dayjs().startOf('day')
}

/**
 * The local-day range a view shows around its anchor date. Month is the full
 * 6-week (42-cell) grid including leading/trailing days, matching what
 * react-big-calendar renders; week runs from the locale week start.
 */
export function visibleRange(
  view: CalendarView,
  date: string | undefined,
): CalendarVisibleRange {
  const anchor = anchorDay(date)

  if (view === 'day') {
    const day = anchor.format('YYYY-MM-DD')
    return { start: day, end: day }
  }

  if (view === 'week') {
    const start = anchor.startOf('week')
    return {
      start: start.format('YYYY-MM-DD'),
      end: start.add(6, 'day').format('YYYY-MM-DD'),
    }
  }

  const gridStart = anchor.startOf('month').startOf('week')
  return {
    start: gridStart.format('YYYY-MM-DD'),
    end: gridStart.add(41, 'day').format('YYYY-MM-DD'),
  }
}

/** The anchor for prev/next navigation — one month/week/day away. */
export function shiftAnchor(
  view: CalendarView,
  date: string | undefined,
  direction: 1 | -1,
): string {
  const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'
  return anchorDay(date).add(direction, unit).format('YYYY-MM-DD')
}

/** Toolbar heading, e.g. "August 2026", "11 – 17 Aug 2026", "Thu, 14 Aug 2026". */
export function rangeTitle(
  view: CalendarView,
  date: string | undefined,
): string {
  const anchor = anchorDay(date)
  if (view === 'month') return anchor.format('MMMM YYYY')
  if (view === 'day') return anchor.format('ddd, D MMM YYYY')

  const start = anchor.startOf('week')
  const end = start.add(6, 'day')
  if (start.month() === end.month()) {
    return `${start.format('D')} – ${end.format('D MMM YYYY')}`
  }
  if (start.year() === end.year()) {
    return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
  }
  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`
}
