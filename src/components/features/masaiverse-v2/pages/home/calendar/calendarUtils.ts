export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Monday-first weekday labels (with stable keys; some labels repeat). */
export const WEEKDAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
] as const

export interface CalendarCell {
  day: number | null
  key: string
  dateKey: string | null
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Always render 6 weeks so the calendar height stays constant across months. */
const TOTAL_CELLS = 42

/**
 * Monday-first grid for the month of `viewDate`. Padded with leading and
 * trailing blank cells to a fixed 6-week (42-cell) grid so the calendar height
 * does not shift between 30- and 31-day months.
 */
export function getMonthGrid(viewDate: Date): Array<CalendarCell> {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (firstOfMonth.getDay() + 6) % 7

  const cells: Array<CalendarCell> = []
  for (let i = 0; i < leading; i++) {
    cells.push({ day: null, key: `lead-${i}`, dateKey: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toDateKey(new Date(year, month, d))
    cells.push({ day: d, key: dateKey, dateKey })
  }
  for (let i = cells.length; i < TOTAL_CELLS; i++) {
    cells.push({ day: null, key: `trail-${i}`, dateKey: null })
  }
  return cells
}

/** Minimal event shape the calendar needs to place dots and list a day's events. */
export interface CalendarEvent {
  id: string
  title: string
  /** UTC ISO start instant; events without one are skipped. */
  startTime: string | null
  /** Hosting club name, or null for a public (community) event. */
  clubName: string | null
}

/**
 * The viewer-local calendar day of a UTC instant as `YYYY-MM-DD` (matching
 * {@link toDateKey}). Returns null when the timestamp is missing/unparseable,
 * so callers can skip undatable events. Using the viewer's timezone keeps the
 * dot on the same day the rest of the app shows the event in.
 */
export function localDateKey(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Buckets events by their viewer-local calendar day, so the calendar can show a
 * dot per day and list the events for a selected day. Events within a day keep
 * their incoming order (the events query already sorts ascending by start time).
 */
export function buildEventsByDate(
  events: Array<CalendarEvent>,
): Map<string, Array<CalendarEvent>> {
  const byDate = new Map<string, Array<CalendarEvent>>()
  for (const event of events) {
    const key = localDateKey(event.startTime)
    if (!key) continue
    const existing = byDate.get(key)
    if (existing) {
      existing.push(event)
    } else {
      byDate.set(key, [event])
    }
  }
  return byDate
}
