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

/**
 * Dummy event dates (keys) relative to `today`, so the calendar always shows
 * dots near the current month. Replace with real event dates from the API.
 */
const DUMMY_EVENT_DAY_OFFSETS = [0, 1, 3, 6, 7, 9, 14, 18, 21, 24]

export function getDummyEventDateKeys(today: Date): Array<string> {
  return DUMMY_EVENT_DAY_OFFSETS.map((offset) =>
    toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)),
  )
}
