import { parseServerTimestamp } from './parseServerTimestamp'

/**
 * Formats post/reply timestamps in a social-feed style using IST.
 * See docs/masaiverse-discussion-relative-time.md for the full rules.
 */

const IST_TIME_ZONE = 'Asia/Kolkata'

function getIstDayId(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isSameIstCalendarDay(a: Date, b: Date): boolean {
  return getIstDayId(a) === getIstDayId(b)
}

function getUtcMidnightFromIstDayId(dayId: string): number {
  return new Date(`${dayId}T00:00:00.000Z`).getTime()
}

function isIstCalendarYesterday(post: Date, now: Date): boolean {
  const postDayUtcMidnight = getUtcMidnightFromIstDayId(getIstDayId(post))
  const nowDayUtcMidnight = getUtcMidnightFromIstDayId(getIstDayId(now))
  return nowDayUtcMidnight - postDayUtcMidnight === 86400000
}

function formatClock12h(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const SAME_DAY_HOURS_AGO_CAP = 6

/**
 * @param value - ISO string from the server, or null when unknown
 * @param now - Optional reference time (defaults to `new Date()`); useful for tests
 */
export function formatSocialPostTime(value: string | null, now: Date = new Date()): string {
  if (!value) {
    return 'Just now'
  }

  const post = parseServerTimestamp(value, { nowMs: now.getTime() })
  if (!post) {
    return 'Just now'
  }

  const diffMs = now.getTime() - post.getTime()
  if (diffMs < 0) {
    return 'Just now'
  }

  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) {
    return 'Just now'
  }

  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60)
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  const sameDay = isSameIstCalendarDay(post, now)

  if (sameDay) {
    const hours = Math.floor(diffSec / 3600)
    if (hours < SAME_DAY_HOURS_AGO_CAP) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }
    return `Today at ${formatClock12h(post)}`
  }

  if (isIstCalendarYesterday(post, now)) {
    return `Yesterday at ${formatClock12h(post)}`
  }

  const includeYear = post.getFullYear() !== now.getFullYear()
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
  if (includeYear) {
    opts.year = 'numeric'
  }
  return post.toLocaleString('en-IN', { ...opts, timeZone: IST_TIME_ZONE })
}
