import dayjs from 'dayjs'
import type { DashboardScheduleItem, ScheduleDateGroup, ScheduleWeekGroup } from './types'
import {
  parseMysqlDatetimeIST,
  formatTimeRangeLocal,
  formatTimeRangeIST,
  formatTimestampLocal as tzFormatTimestampLocal,
  formatTimestampIST as tzFormatTimestampIST,
  getTodayDateKeyTz,
  getWeekWindowTz,
} from '@/utils/timeZoneHandler'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// ── Aliases kept for backward compat with any callers ─────────────────────────

export function formatTimestampLocal(raw: string, skewMs = 0): string {
  return tzFormatTimestampLocal(raw, skewMs)
}

export function formatTimestampIST(raw: string): string {
  return tzFormatTimestampIST(raw)
}

/** Schedule card — device-local time, skew-adjusted. */
export function formatScheduleTime(item: DashboardScheduleItem, skewMs = 0): string {
  return formatTimeRangeLocal(item.schedule, item.concludes, skewMs)
}

/** Tooltip — always IST. */
export function formatScheduleTimeIST(item: DashboardScheduleItem): string {
  return formatTimeRangeIST(item.schedule, item.concludes)
}

// ── Date helpers ───────────────────────────────────────────────────────────────

/** dayjs in device-local mode from a dayjs (any tz) UTC value. */
function toLocal(d: dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(d.valueOf())
}

function toDateKey(d: dayjs.Dayjs): string {
  return `${d.year()}-${pad(d.month() + 1)}-${pad(d.date())}`
}

function toDayLabel(d: dayjs.Dayjs): string {
  return `${DAY_NAMES[d.day()]} ${pad(d.date())}`
}

function toWeekLabel(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
  const sm = MONTH_NAMES[start.month()].toUpperCase()
  const em = MONTH_NAMES[end.month()].toUpperCase()
  if (sm === em) return `${sm} ${pad(start.date())}-${pad(end.date())}`
  return `${sm} ${pad(start.date())} - ${em} ${pad(end.date())}`
}

/** Parse "yyyy-mm-dd" as local midnight dayjs. */
function parseLocalDate(dateStr: string | null): dayjs.Dayjs | null {
  if (!dateStr) return null
  const d = dayjs(dateStr) // local midnight
  return d.isValid() ? d : null
}

// ── Public utilities ───────────────────────────────────────────────────────────

export function groupPendingByDeadline(
  items: Array<DashboardScheduleItem>,
): Array<ScheduleDateGroup> {
  const dateMap = new Map<string, { date: dayjs.Dayjs; items: Array<DashboardScheduleItem> }>()

  for (const item of items) {
    const raw = parseMysqlDatetimeIST(item.concludes)
    if (!raw) continue
    const d = toLocal(raw)
    const dateKey = toDateKey(d)
    const bucket = dateMap.get(dateKey)
    if (bucket) bucket.items.push(item)
    else dateMap.set(dateKey, { date: d, items: [item] })
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([dateKey, { date, items: dayItems }]) => ({
      dateKey,
      date: date.toDate(),
      dayLabel: toDayLabel(date),
      items: dayItems,
    }))
}

export function getTodayDateKey(now?: dayjs.Dayjs): string {
  return getTodayDateKeyTz(now ?? dayjs())
}

export function getWeekWindow(now?: dayjs.Dayjs): { weekStart: dayjs.Dayjs; weekEnd: dayjs.Dayjs } {
  return getWeekWindowTz(now ?? dayjs())
}

export function extractSpanningItems(
  items: Array<DashboardScheduleItem>,
  now?: dayjs.Dayjs,
): Array<DashboardScheduleItem> {
  const { weekStart, weekEnd } = getWeekWindow(now)
  return items.filter((item) => {
    const sd = parseLocalDate(item.startDate)
    const ed = parseLocalDate(item.endDate)
    if (!sd || !ed) return false
    return sd.isBefore(weekStart) && ed.isAfter(weekEnd)
  })
}

export function groupItemsByWeek(
  items: Array<DashboardScheduleItem>,
  now?: dayjs.Dayjs,
): Array<ScheduleWeekGroup> {
  const { weekStart, weekEnd } = getWeekWindow(now)
  const itemsByDay = new Map<string, Array<DashboardScheduleItem>>()

  const addToDay = (d: dayjs.Dayjs, item: DashboardScheduleItem) => {
    const key = toDateKey(d)
    const bucket = itemsByDay.get(key)
    if (bucket) bucket.push(item)
    else itemsByDay.set(key, [item])
  }

  const inWindow = (d: dayjs.Dayjs) => !d.isBefore(weekStart) && !d.isAfter(weekEnd)

  for (const item of items) {
    const sd = parseLocalDate(item.startDate)
    const ed = parseLocalDate(item.endDate)

    if (sd && ed && sd.isBefore(weekStart) && ed.isAfter(weekEnd)) continue

    const sdInWindow = sd && inWindow(sd)
    const edInWindow = ed && inWindow(ed)

    if (sdInWindow) addToDay(sd, item)
    if (edInWindow && (!sd || toDateKey(ed) !== toDateKey(sd))) addToDay(ed, item)

    if (!sdInWindow && !edInWindow) {
      const raw = parseMysqlDatetimeIST(item.schedule)
      if (raw) {
        const d = toLocal(raw)
        if (inWindow(d)) addToDay(d, item)
      }
    }
  }

  const dateGroups: Array<ScheduleDateGroup> = []
  for (let i = 0; i < 7; i++) {
    const date = weekStart.add(i, 'day')
    const dateKey = toDateKey(date)
    dateGroups.push({
      dateKey,
      date: date.toDate(),
      dayLabel: toDayLabel(date),
      items: itemsByDay.get(dateKey) ?? [],
    })
  }

  const windowEnd = dateGroups[6]?.date ? dayjs(dateGroups[6].date) : weekEnd
  return [{ weekLabel: toWeekLabel(weekStart, windowEnd), dateGroups }]
}
