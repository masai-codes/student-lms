import type { DashboardScheduleItem, ScheduleDateGroup, ScheduleWeekGroup } from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parseMysqlDatetime(raw: string | null): Date | null {
  if (!raw) return null
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Parse a yyyy-mm-dd date string as a local midnight Date (no timezone shift). */
function parseLocalDate(dateStr: string | null): Date | null {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatHour(d: Date): string {
  const h = d.getHours() % 12 || 12
  const min = d.getMinutes()
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  return min === 0 ? `${h}${ampm}` : `${h}:${pad(min)} ${ampm}`
}

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * For a **single-day** event: returns "8PM - 10PM" style range.
 * Used when start_date === end_date (or dates unavailable).
 */
export function formatTimeRange(schedule: string | null, concludes: string | null): string {
  const start = parseMysqlDatetime(schedule)
  if (!start) return ''
  const end = concludes ? parseMysqlDatetime(concludes) : null
  if (!end) return formatHour(start)
  if (isSameDay(start, end)) {
    return `${formatHour(start)} - ${formatHour(end)}`
  }
  // Cross-day: "8 Jan, 11AM - 12 Jan, 11:30 AM"
  return `${formatShortDate(start)}, ${formatHour(start)} - ${formatShortDate(end)}, ${formatHour(end)}`
}

/**
 * For a **multi-day** event: returns just the end date, e.g. "12 Jun".
 * Used when start_date !== end_date.
 */
export function formatEndDate(endDate: string | null): string {
  const d = parseLocalDate(endDate)
  if (!d) return ''
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

/**
 * Returns the display string for the time/date slot on a schedule card.
 * - Single-day (startDate === endDate or dates unavailable): "8PM - 10PM"
 * - Multi-day: "Ends 12 Jun"
 */
export function formatScheduleTime(item: DashboardScheduleItem): string {
  const isMultiDay =
    item.startDate &&
    item.endDate &&
    item.startDate !== item.endDate

  if (isMultiDay) {
    const end = formatEndDate(item.endDate)
    return end ? `Ends ${end}` : ''
  }
  return formatTimeRange(item.schedule, item.concludes)
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDayLabel(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${pad(d.getDate())}`
}

function toWeekLabel(start: Date, end: Date): string {
  const sm = MONTH_NAMES[start.getMonth()].toUpperCase()
  const em = MONTH_NAMES[end.getMonth()].toUpperCase()
  if (sm === em) {
    return `${sm} ${pad(start.getDate())}-${pad(end.getDate())}`
  }
  return `${sm} ${pad(start.getDate())} - ${em} ${pad(end.getDate())}`
}

/**
 * Groups pending items by their DEADLINE date (concludes field), sorted
 * soonest-deadline first. Used in the Pending Tasks tab.
 */
export function groupPendingByDeadline(
  items: Array<DashboardScheduleItem>,
): Array<ScheduleDateGroup> {
  const dateMap = new Map<string, { date: Date; items: Array<DashboardScheduleItem> }>()

  for (const item of items) {
    const d = parseMysqlDatetime(item.concludes)
    if (!d) continue
    const dateKey = toDateKey(d)
    const bucket = dateMap.get(dateKey)
    if (bucket) {
      bucket.items.push(item)
    } else {
      dateMap.set(dateKey, { date: d, items: [item] })
    }
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([dateKey, { date, items: dayItems }]) => ({
      dateKey,
      date,
      dayLabel: toDayLabel(date),
      items: dayItems,
    }))
}

export function getTodayDateKey(): string {
  return toDateKey(new Date())
}

/**
 * Groups schedule items into a rolling 7-day window starting from today
 * (today → today + 6 days, i.e. the same weekday next week − 1 day).
 *
 * Items are bucketed by their start_date (preferred) or schedule datetime.
 * All 7 days are always emitted so empty days are visible in the UI.
 */
export function groupItemsByWeek(items: Array<DashboardScheduleItem>): Array<ScheduleWeekGroup> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build a lookup: dateKey → items
  const itemsByDay = new Map<string, Array<DashboardScheduleItem>>()

  for (const item of items) {
    // Prefer start_date (date column) over schedule (datetime)
    const d = item.startDate
      ? parseLocalDate(item.startDate)
      : parseMysqlDatetime(item.schedule)
    if (!d) continue
    const dateKey = toDateKey(d)
    const bucket = itemsByDay.get(dateKey)
    if (bucket) {
      bucket.push(item)
    } else {
      itemsByDay.set(dateKey, [item])
    }
  }

  // Always produce all 7 days today … today+6
  const dateGroups: Array<ScheduleDateGroup> = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const dateKey = toDateKey(date)
    dateGroups.push({
      dateKey,
      date,
      dayLabel: toDayLabel(date),
      items: itemsByDay.get(dateKey) ?? [],
    })
  }

  const windowEnd = dateGroups[6].date
  return [{ weekLabel: toWeekLabel(today, windowEnd), dateGroups }]
}
