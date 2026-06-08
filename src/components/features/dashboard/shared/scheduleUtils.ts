import type { DashboardScheduleItem, ScheduleDateGroup, ScheduleWeekGroup } from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Parse a datetime string from the API as IST (Asia/Kolkata, UTC+5:30).
 * API values are stored and returned in IST — strip any existing tz suffix
 * and reattach +05:30 so the JS Date represents the correct UTC moment.
 */
function parseMysqlDatetime(raw: string | null): Date | null {
  if (!raw) return null
  let s = raw.includes('T') ? raw : raw.replace(' ', 'T')
  // Remove any existing offset/Z — the clock value is always IST
  s = s.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '')
  const d = new Date(`${s}+05:30`)
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

/**
 * Returns the browser's timezone abbreviation, e.g. "IST", "CET", "EST".
 * When `timeZoneName: 'short'` only gives a raw offset like "GMT+1",
 * we derive an abbreviation from the long name instead:
 *   "Central European Time" → "CET"
 *   "West Africa Time"      → "WAT"
 */
function getTimezoneAbbr(): string {
  const now = new Date()

  const short = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value ?? ''

  // If we already have a proper abbreviation (not a raw offset), use it
  if (short && !short.startsWith('GMT')) return short

  // Derive from long name: "Central European Summer Time" → "CEST"
  const long = Intl.DateTimeFormat('en', { timeZoneName: 'long' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value ?? ''

  if (long && !long.startsWith('GMT')) {
    return long.split(' ').map((w) => w[0].toUpperCase()).join('')
  }

  // Last resort: keep the raw GMT offset
  return short
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
 * Main display — user's local timezone.
 * e.g. "7:43 AM - 8:42 AM (EDT)"
 */
export function formatTimeRange(schedule: string | null, concludes: string | null): string {
  const start = parseMysqlDatetime(schedule)
  if (!start) return ''
  const tz = getTimezoneAbbr()
  const end = concludes ? parseMysqlDatetime(concludes) : null
  if (!end) return `${formatHour(start)} (${tz})`
  if (isSameDay(start, end)) {
    return `${formatHour(start)} - ${formatHour(end)} (${tz})`
  }
  return `${formatShortDate(start)}, ${formatHour(start)} - ${formatShortDate(end)}, ${formatHour(end)} (${tz})`
}

/** Returns the local timezone string for the main schedule card display. */
export function formatScheduleTime(item: DashboardScheduleItem): string {
  return formatTimeRange(item.schedule, item.concludes)
}

/** Format a Date as "8PM" or "8:30PM" in IST (Asia/Kolkata). */
function formatHourIST(d: Date): string {
  const parts = Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).formatToParts(d)
  const h = parts.find((p) => p.type === 'hour')?.value ?? ''
  const min = parts.find((p) => p.type === 'minute')?.value ?? '00'
  const ampm = (parts.find((p) => p.type === 'dayPeriod')?.value ?? '').toUpperCase()
  return min === '00' ? `${h}${ampm}` : `${h}:${min} ${ampm}`
}

/** Format a Date as "31 May" in IST. */
function formatShortDateIST(d: Date): string {
  const parts = Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(d)
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  return `${day} ${month}`
}

/** Returns true if two dates fall on the same calendar day in IST. */
function isSameDayIST(a: Date, b: Date): boolean {
  return formatShortDateIST(a) === formatShortDateIST(b)
}

/**
 * Tooltip display — always hardcoded IST.
 * e.g. "5:13 PM - 6:12 PM (IST)" or "31 May, 5:13 PM - 10 Jun, 6:12 PM (IST)"
 */
export function formatScheduleTimeIST(item: DashboardScheduleItem): string {
  const start = parseMysqlDatetime(item.schedule)
  if (!start) return ''
  const end = item.concludes ? parseMysqlDatetime(item.concludes) : null
  if (!end) return `${formatHourIST(start)} (IST)`
  if (isSameDayIST(start, end)) {
    return `${formatHourIST(start)} - ${formatHourIST(end)} (IST)`
  }
  return `${formatShortDateIST(start)}, ${formatHourIST(start)} - ${formatShortDateIST(end)}, ${formatHourIST(end)} (IST)`
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

/** Returns the rolling 7-day window: { weekStart = today midnight, weekEnd = today+6 midnight } */
export function getWeekWindow(): { weekStart: Date; weekEnd: Date } {
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  weekEnd.setHours(0, 0, 0, 0)
  return { weekStart, weekEnd }
}

/**
 * Returns items that span the ENTIRE week — i.e. start_date is before the
 * week start AND end_date is after the week end. These should be shown in
 * the Pending Tasks tab instead of My Schedule.
 */
export function extractSpanningItems(
  items: Array<DashboardScheduleItem>,
): Array<DashboardScheduleItem> {
  const { weekStart, weekEnd } = getWeekWindow()
  return items.filter((item) => {
    const sd = item.startDate ? parseLocalDate(item.startDate) : null
    const ed = item.endDate ? parseLocalDate(item.endDate) : null
    if (!sd || !ed) return false
    return sd < weekStart && ed > weekEnd
  })
}

/**
 * Groups schedule items into a rolling 7-day window starting from today
 * (today → today + 6 days).
 *
 * Rules:
 * - Items whose start_date < weekStart AND end_date > weekEnd are SKIPPED
 *   (they span the whole week and belong in Pending Tasks instead).
 * - If start_date falls within the window → card shown on start_date slot.
 * - If end_date falls within the window AND differs from start_date → card
 *   ALSO shown on end_date slot (card appears on both boundary dates).
 * - If only one boundary is in the window, shown on that date only.
 *
 * All 7 days are always emitted so empty days are visible in the UI.
 */
export function groupItemsByWeek(items: Array<DashboardScheduleItem>): Array<ScheduleWeekGroup> {
  const { weekStart, weekEnd } = getWeekWindow()

  // Build a lookup: dateKey → items
  const itemsByDay = new Map<string, Array<DashboardScheduleItem>>()

  const addToDay = (d: Date, item: DashboardScheduleItem) => {
    const dateKey = toDateKey(d)
    const bucket = itemsByDay.get(dateKey)
    if (bucket) {
      bucket.push(item)
    } else {
      itemsByDay.set(dateKey, [item])
    }
  }

  const inWindow = (d: Date) => d >= weekStart && d <= weekEnd

  for (const item of items) {
    const sd = item.startDate ? parseLocalDate(item.startDate) : null
    const ed = item.endDate ? parseLocalDate(item.endDate) : null

    // Skip items that span the entire week (shown in Pending Tasks instead)
    if (sd && ed && sd < weekStart && ed > weekEnd) continue

    const sdInWindow = sd && inWindow(sd)
    const edInWindow = ed && inWindow(ed)

    if (sdInWindow) addToDay(sd!, item)
    // Show on end_date slot too if it's a different day within the window
    if (edInWindow && (!sd || toDateKey(ed!) !== toDateKey(sd))) addToDay(ed!, item)

    // Fallback: no date info — use schedule datetime
    if (!sdInWindow && !edInWindow) {
      const d = parseMysqlDatetime(item.schedule)
      if (d && inWindow(d)) addToDay(d, item)
    }
  }

  // Always produce all 7 days today … today+6
  const dateGroups: Array<ScheduleDateGroup> = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    const dateKey = toDateKey(date)
    dateGroups.push({
      dateKey,
      date,
      dayLabel: toDayLabel(date),
      items: itemsByDay.get(dateKey) ?? [],
    })
  }

  const windowEnd = dateGroups[6].date
  return [{ weekLabel: toWeekLabel(weekStart, windowEnd), dateGroups }]
}
