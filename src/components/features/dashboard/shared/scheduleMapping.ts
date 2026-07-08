import type { LearnContentItem } from '@/components/features/learn/shared/types'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'
import {
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
} from '@/utils/timeZoneHandler'

/**
 * Maps a dashboard schedule item to the `/learn` listing card's item shape (the
 * same mapping the learn page uses), plus dashboard-only bits: the `courseName`
 * label and a formatted date **range** (viewer-local, with an IST hover
 * tooltip). Tags are trimmed to category + module for the compact card.
 */
export function scheduleItemToLearnContent(item: DashboardScheduleItem): LearnContentItem {
  return {
    id: item.id,
    type: item.learningType,
    title: item.title,
    hostName: item.hostName,
    date: formatScheduleRangeLocal(item.scheduleDate, item.concludes) || null,
    category: item.category,
    learningSubType: item.type,
    priority: item.isOptional,
    tags: [item.category, item.moduleName],
    attendance: item.attendance,
    assignmentProgressStatus: item.assignmentProgressStatus,
    resourcePhase: item.resourcePhase,
    listingCtas: item.listingCtas,
    assignmentStatusChip: item.listingCtas.assignmentStatusChip,
    assignmentDeadlineLabel: item.listingCtas.assignmentDeadlineLabel,
    courseName: item.courseName,
    dateTooltip: formatScheduleRangeIST(item.scheduleDate, item.concludes) || null,
  }
}

export interface ScheduleDayRow {
  /** IST calendar-day key `YYYY-MM-DD`. */
  key: string
  /** Short weekday, e.g. "Thu". */
  weekday: string
  /** Zero-padded day of month, e.g. "02". */
  dayOfMonth: string
  /** True for today (the first day of the window). */
  isToday: boolean
  items: Array<DashboardScheduleItem>
}

export interface ScheduleWeek {
  /** Header label, e.g. "Jul 02 - 08" (or "Jul 30 - Aug 05" across months). */
  rangeLabel: string
  days: Array<ScheduleDayRow>
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
const SCHEDULE_WEEK_DAYS = 7

/**
 * Builds the fixed 7-day window (today … today + 6 in IST), placing each
 * schedule item on its IST day. Every day appears — empty ones included — so
 * the UI can render a "No sessions" row per day.
 */
export function buildScheduleWeek(
  items: Array<DashboardScheduleItem>,
  now: Date,
  dayCount: number = SCHEDULE_WEEK_DAYS,
): ScheduleWeek {
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  const baseY = ist.getUTCFullYear()
  const baseM = ist.getUTCMonth()
  const baseD = ist.getUTCDate()

  const itemsByKey = new Map<string, Array<DashboardScheduleItem>>()
  for (const item of items) {
    const key = istDayKey(item.scheduleDate)
    if (!key) continue
    const bucket = itemsByKey.get(key)
    if (bucket) bucket.push(item)
    else itemsByKey.set(key, [item])
  }

  const days: Array<ScheduleDayRow> = []
  for (let i = 0; i < dayCount; i += 1) {
    const date = new Date(Date.UTC(baseY, baseM, baseD + i))
    const key = date.toISOString().slice(0, 10)
    days.push({
      key,
      weekday: format(date, { weekday: 'short' }),
      dayOfMonth: String(date.getUTCDate()).padStart(2, '0'),
      isToday: i === 0,
      items: itemsByKey.get(key) ?? [],
    })
  }

  return { rangeLabel: buildRangeLabel(days), days }
}

function buildRangeLabel(days: Array<ScheduleDayRow>): string {
  if (days.length === 0) return ''
  const first = new Date(`${days[0].key}T00:00:00Z`)
  const last = new Date(`${days[days.length - 1].key}T00:00:00Z`)
  const firstLabel = `${format(first, { month: 'short' })} ${days[0].dayOfMonth}`
  const sameMonth = first.getUTCMonth() === last.getUTCMonth()
  const lastLabel = sameMonth
    ? days[days.length - 1].dayOfMonth
    : `${format(last, { month: 'short' })} ${days[days.length - 1].dayOfMonth}`
  return `${firstLabel} - ${lastLabel}`
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date)
}

/**
 * IST calendar day `YYYY-MM-DD` for a schedule value. DB datetimes are stored as
 * IST wall-clock, so the date component IS the IST day — no timezone shift.
 */
function istDayKey(value: string | null): string {
  if (!value) return ''
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return match ? match[1] : ''
}
