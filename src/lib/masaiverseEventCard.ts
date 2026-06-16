/**
 * Derives the display bits of a Masaiverse event card from its UTC start/end
 * timestamps. All wall-clock formatting is done in the viewer's own timezone
 * (their device timezone), matching the rest of the app (see
 * `socialRelativeTime.ts`), so a learner in any region sees the time on their
 * own clock with a timezone label (e.g. "IST", "GST", "EST").
 *
 * Left badge precedence: LIVE → TODAY → TOMORROW → the start time (e.g. "2:00 PM").
 * The date box on the right always shows the start date (day + short month).
 */
import { getTzLabel } from '@/utils/timeZoneHandler'

const DAY_MS = 24 * 60 * 60 * 1000

export interface EventCardDisplay {
  isLive: boolean
  badgeLabel: string
  dateDay: string
  dateMonth: string
}

type EventTimes = {
  startTime: string | null
  endTime: string | null
}

/** Parse a UTC ISO instant, returning null when missing/unparseable. */
function toDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Parse a UTC ISO instant. Returns null when missing/unparseable. */
function toLocalDate(value: string | null): Date | null {
  return toDate(value)
}

/** Viewer-local calendar day as `YYYY-MM-DD`, used to compare today / tomorrow. */
function localDayId(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatLocalTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Formats a UTC ISO instant as a viewer-local date + time, e.g.
 * "May 28 · 2:00 PM (IST)". Returns null when the timestamp is
 * missing or unparseable.
 */
export function formatLocalDateTime(
  value: string | null,
): string | null {
  const date = toLocalDate(value)
  if (!date) return null
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
  return `${datePart} · ${formatLocalTime(date)} (${getTzLabel()})`
}

export type EventStatus = 'live' | 'upcoming' | 'completed'

/**
 * Derives an event's lifecycle status from its UTC timestamps:
 * - `live`: started and not yet ended (needs both timestamps)
 * - `upcoming`: starts in the future, or has only a future end time
 * - `completed`: everything else (already ended / started with no future end)
 *
 * Compares true instants, so it is timezone-independent (no skew applied).
 */
export function getEventStatus(event: EventTimes, now: Date): EventStatus {
  const start = toDate(event.startTime)
  const end = toDate(event.endTime)
  const t = now.getTime()

  if (start && end && start.getTime() <= t && t <= end.getTime()) return 'live'
  if (start && start.getTime() > t) return 'upcoming'
  if (!start && end && end.getTime() > t) return 'upcoming'
  return 'completed'
}

export interface LocalDayBadge {
  /** Uppercase short weekday, e.g. "WED". */
  weekday: string
  /** Day of month, e.g. "21". */
  day: string
}

/**
 * Formats a UTC ISO instant as a viewer-local `{ weekday, day }` badge
 * (e.g. WED 21). Returns null when the timestamp is missing or unparseable.
 */
export function formatLocalDayBadge(
  value: string | null,
): LocalDayBadge | null {
  const date = toLocalDate(value)
  if (!date) return null
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
  }).format(date)
  return { weekday, day }
}

export function getEventCardDisplay(
  event: EventTimes,
  now: Date,
): EventCardDisplay {
  const start = toDate(event.startTime)
  const end = toDate(event.endTime)

  const isLive =
    start != null &&
    end != null &&
    start.getTime() <= now.getTime() &&
    now.getTime() <= end.getTime()

  // The date box uses the start instant, falling back to end when start is
  // absent, shown in the viewer's timezone.
  const dateBasis = toLocalDate(event.startTime) ?? toLocalDate(event.endTime)
  const dateDay = dateBasis
    ? new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
      }).format(dateBasis)
    : ''
  const dateMonth = dateBasis
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
      })
        .format(dateBasis)
        .toUpperCase()
    : ''

  let badgeLabel = ''
  if (isLive) {
    badgeLabel = 'LIVE'
  } else if (start) {
    const startDay = localDayId(start)
    if (startDay === localDayId(now)) {
      badgeLabel = 'TODAY'
    } else if (startDay === localDayId(new Date(now.getTime() + DAY_MS))) {
      badgeLabel = 'TOMORROW'
    } else {
      badgeLabel = formatLocalTime(start)
    }
  }

  return { isLive, badgeLabel, dateDay, dateMonth }
}
