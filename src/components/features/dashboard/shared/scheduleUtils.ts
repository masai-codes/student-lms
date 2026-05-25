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

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDayLabel(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${pad(d.getDate())}`
}

function toWeekLabel(weekStart: Date, weekEnd: Date): string {
  const sm = MONTH_NAMES[weekStart.getMonth()].toUpperCase()
  const em = MONTH_NAMES[weekEnd.getMonth()].toUpperCase()
  if (sm === em) {
    return `${sm} ${weekStart.getDate()}-${weekEnd.getDate()}`
  }
  return `${sm} ${weekStart.getDate()} - ${em} ${weekEnd.getDate()}`
}

function getMondayOf(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
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

export function groupItemsByWeek(items: Array<DashboardScheduleItem>): Array<ScheduleWeekGroup> {
  const today = new Date()
  const monday = getMondayOf(today)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)

  // Bucket items by their schedule date
  const itemsByDay = new Map<string, Array<DashboardScheduleItem>>()
  for (const item of items) {
    const d = parseMysqlDatetime(item.schedule)
    if (!d) continue
    const dateKey = toDateKey(d)
    const bucket = itemsByDay.get(dateKey)
    if (bucket) {
      bucket.push(item)
    } else {
      itemsByDay.set(dateKey, [item])
    }
  }

  // Always produce all 7 days Mon–Sun so empty days are visible
  const dateGroups: Array<ScheduleDateGroup> = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const dateKey = toDateKey(date)
    dateGroups.push({
      dateKey,
      date,
      dayLabel: toDayLabel(date),
      items: itemsByDay.get(dateKey) ?? [],
    })
  }

  return [{ weekLabel: toWeekLabel(monday, sunday), dateGroups }]
}
