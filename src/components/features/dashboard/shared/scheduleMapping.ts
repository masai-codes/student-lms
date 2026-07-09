import dayjs from 'dayjs'
import type { LearnContentItem } from '@/components/features/learn/shared/types'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'
import {
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
  parseMysqlDatetimeIST,
} from '@/utils/timeZoneHandler'

/**
 * Maps a dashboard schedule item to the `/learn` listing card's item shape (the
 * same mapping the learn page uses), plus dashboard-only bits: the `courseName`
 * label and a formatted date **range** (viewer-local, with an IST hover
 * tooltip). Tags are trimmed to category + module for the compact card.
 *
 * `includeDeadlineLabel` controls the assignment "N days/hours remaining"
 * countdown: it's shown only on the Pending Tasks tab, never on My Schedule.
 */
export function scheduleItemToLearnContent(
  item: DashboardScheduleItem,
  { includeDeadlineLabel = true }: { includeDeadlineLabel?: boolean } = {},
): LearnContentItem {
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
    assignmentDeadlineLabel: includeDeadlineLabel
      ? item.listingCtas.assignmentDeadlineLabel
      : null,
    courseName: item.courseName,
    dateTooltip:
      formatScheduleRangeIST(item.scheduleDate, item.concludes) || null,
  }
}

export interface ScheduleDayRow {
  /** Viewer-local calendar-day key `YYYY-MM-DD`. */
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

const SCHEDULE_WEEK_DAYS = 7

/**
 * Builds the fixed 7-day window (today … today + 6 in the viewer's local
 * timezone). Every day appears — empty ones included — so the UI can render a
 * "No sessions" row per day.
 *
 * Each item lands on exactly **one** day, never duplicated across the week:
 * - Point-in-time items (lectures/resources): their scheduled day.
 * - Assignments run over a window (`schedule`→`concludes`); while active they
 *   pin to **today**, not every day in between. So a 27 Mar → 10 Apr assignment
 *   shows only on today's row on the 27th, the 28th, … through the 10th — one
 *   day at a time as "today" advances.
 *
 * Concretely each item's target day is `max(today, scheduleDay)`, shown only if
 * that day still falls within the item's span (i.e. not past `concludes`):
 * active items surface on today, not-yet-started ones on their start day, and
 * concluded ones drop off.
 *
 * The grid and item bucketing both use the viewer's **local** calendar day so
 * that each item's row matches the local date its card renders (via
 * {@link formatScheduleRangeLocal}). DB values are IST wall-clock, so they're
 * parsed to the true instant and re-read in local time before bucketing.
 */
export function buildScheduleWeek(
  items: Array<DashboardScheduleItem>,
  now: Date,
  dayCount: number = SCHEDULE_WEEK_DAYS,
): ScheduleWeek {
  const baseY = now.getFullYear()
  const baseM = now.getMonth()
  const baseD = now.getDate()

  const days: Array<ScheduleDayRow> = []
  for (let i = 0; i < dayCount; i += 1) {
    const date = new Date(Date.UTC(baseY, baseM, baseD + i))
    days.push({
      key: date.toISOString().slice(0, 10),
      weekday: format(date, { weekday: 'short' }),
      dayOfMonth: String(date.getUTCDate()).padStart(2, '0'),
      isToday: i === 0,
      items: [],
    })
  }

  const todayKey = days[0]?.key ?? ''
  const dayByKey = new Map(days.map((day) => [day.key, day]))

  for (const item of items) {
    const span = itemDaySpan(item)
    if (!span) continue
    // `YYYY-MM-DD` strings compare chronologically as plain strings.
    const targetKey = span.start > todayKey ? span.start : todayKey
    if (targetKey > span.end) continue // already concluded — drop it
    dayByKey.get(targetKey)?.items.push(item)
  }

  return { rangeLabel: buildRangeLabel(days), days }
}

interface DaySpan {
  /** First local day the item occupies (`YYYY-MM-DD`). */
  start: string
  /** Last local day the item occupies (`YYYY-MM-DD`), inclusive. */
  end: string
}

/**
 * The inclusive local-day span an item occupies. Returns `null` when the item
 * has no parseable schedule day. Assignments span `schedule`→`concludes`;
 * everything else is a single day (`schedule`).
 */
function itemDaySpan(item: DashboardScheduleItem): DaySpan | null {
  const start = localDayKey(item.scheduleDate)
  if (!start) return null
  if (item.learningType !== 'assignment') return { start, end: start }
  const end = localDayKey(item.concludes)
  if (!end || end < start) return { start, end: start }
  return { start, end }
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
  return new Intl.DateTimeFormat('en-GB', {
    ...options,
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Viewer-local calendar day `YYYY-MM-DD` for a schedule value. DB datetimes are
 * stored as IST wall-clock, so they're parsed to the true instant and re-read in
 * the device timezone — matching the date the card renders via
 * {@link formatScheduleRangeLocal}.
 */
function localDayKey(value: string | null): string {
  const parsed = parseMysqlDatetimeIST(value)
  if (!parsed) return ''
  const local = dayjs(parsed.valueOf())
  return `${local.year()}-${pad(local.month() + 1)}-${pad(local.date())}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
