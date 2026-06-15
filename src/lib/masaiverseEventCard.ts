/**
 * Derives the display bits of a Masaiverse event card from its UTC start/end
 * timestamps. All wall-clock formatting is done in IST, matching the rest of
 * the app (see `socialRelativeTime.ts`).
 *
 * Left badge precedence: LIVE → TODAY → TOMORROW → the start time (e.g. "2:00 PM").
 * The date box on the right always shows the start date (day + short month).
 */
const IST_TIME_ZONE = 'Asia/Kolkata'
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

/** IST calendar day as `YYYY-MM-DD`, used to compare today / tomorrow. */
function istDayId(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatIstTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function toDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Formats a UTC ISO instant as an IST date + time, e.g. "May 28 · 2:00 PM".
 * Returns null when the timestamp is missing or unparseable.
 */
export function formatIstDateTime(value: string | null): string | null {
  const date = toDate(value)
  if (!date) return null
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    month: 'short',
    day: 'numeric',
  }).format(date)
  return `${datePart} · ${formatIstTime(date)}`
}

export type EventStatus = 'live' | 'upcoming' | 'completed'

/**
 * Derives an event's lifecycle status from its UTC timestamps:
 * - `live`: started and not yet ended (needs both timestamps)
 * - `upcoming`: starts in the future, or has only a future end time
 * - `completed`: everything else (already ended / started with no future end)
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

export interface IstDayBadge {
  /** Uppercase short weekday, e.g. "WED". */
  weekday: string
  /** Day of month, e.g. "21". */
  day: string
}

/**
 * Formats a UTC ISO instant as an IST `{ weekday, day }` badge (e.g. WED 21).
 * Returns null when the timestamp is missing or unparseable.
 */
export function formatIstDayBadge(value: string | null): IstDayBadge | null {
  const date = toDate(value)
  if (!date) return null
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    weekday: 'short',
  })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
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

  // The date box uses the start instant, falling back to end when start is absent.
  const dateBasis = start ?? end
  const dateDay = dateBasis
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: IST_TIME_ZONE,
        day: 'numeric',
      }).format(dateBasis)
    : ''
  const dateMonth = dateBasis
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: IST_TIME_ZONE,
        month: 'short',
      })
        .format(dateBasis)
        .toUpperCase()
    : ''

  let badgeLabel = ''
  if (isLive) {
    badgeLabel = 'LIVE'
  } else if (start) {
    const startDay = istDayId(start)
    if (startDay === istDayId(now)) {
      badgeLabel = 'TODAY'
    } else if (startDay === istDayId(new Date(now.getTime() + DAY_MS))) {
      badgeLabel = 'TOMORROW'
    } else {
      badgeLabel = formatIstTime(start)
    }
  }

  return { isLive, badgeLabel, dateDay, dateMonth }
}
