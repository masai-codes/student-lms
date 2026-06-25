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

export function formatTimestampLocal(raw: string): string {
  return tzFormatTimestampLocal(raw)
}

export function formatTimestampIST(raw: string): string {
  return tzFormatTimestampIST(raw)
}

/** Schedule card — device-local time. */
export function formatScheduleTime(item: DashboardScheduleItem): string {
  return formatTimeRangeLocal(item.schedule, item.concludes)
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
    const scheduleRaw = parseMysqlDatetimeIST(item.schedule)
    const concludesRaw = parseMysqlDatetimeIST(item.concludes)
    if (!scheduleRaw || !concludesRaw) return false
    const sd = toLocal(scheduleRaw)
    const ed = toLocal(concludesRaw)
    return sd.isBefore(weekStart, 'day') && ed.isAfter(weekEnd, 'day')
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

  const inWindow = (d: dayjs.Dayjs) => !d.isBefore(weekStart, 'day') && !d.isAfter(weekEnd, 'day')

  for (const item of items) {
    const scheduleRaw = parseMysqlDatetimeIST(item.schedule)
    const concludesRaw = parseMysqlDatetimeIST(item.concludes)

    const sd = scheduleRaw ? toLocal(scheduleRaw) : null
    const ed = concludesRaw ? toLocal(concludesRaw) : null

    if (sd && ed && sd.isBefore(weekStart, 'day') && ed.isAfter(weekEnd, 'day')) continue

    const sdInWindow = sd && inWindow(sd)
    const edInWindow = ed && inWindow(ed)

    if (sdInWindow) addToDay(sd, item)
    if (edInWindow && (!sd || toDateKey(ed) !== toDateKey(sd))) addToDay(ed, item)
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
