import { parseServerTimestamp } from './parseServerTimestamp'

/**
 * Formats post/reply timestamps in a social-feed style using the viewer's own
 * timezone (their device timezone), so wall-clock times ("Today at 2:30 PM")
 * read on the user's own clock. See
 * docs/masaiverse-discussion-relative-time.md for the full rules.
 *
 * `skewMs` (server UTC − device UTC, from {@link useServerTime}) is subtracted
 * from the displayed instants so the wall-clock matches the user's device clock.
 * Relative durations ("2 hours ago") use true times, so they are unaffected.
 */

/** Viewer-local calendar day as `YYYY-MM-DD`. */
function getLocalDayId(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return getLocalDayId(a) === getLocalDayId(b)
}

function getUtcMidnightFromLocalDayId(dayId: string): number {
  return new Date(`${dayId}T00:00:00.000Z`).getTime()
}

function isLocalCalendarYesterday(post: Date, now: Date): boolean {
  const postDayUtcMidnight = getUtcMidnightFromLocalDayId(getLocalDayId(post))
  const nowDayUtcMidnight = getUtcMidnightFromLocalDayId(getLocalDayId(now))
  return nowDayUtcMidnight - postDayUtcMidnight === 86400000
}

function formatClock12h(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const SAME_DAY_HOURS_AGO_CAP = 6

/**
 * @param value - ISO string from the server, or null when unknown
 * @param now - Optional reference time (defaults to `new Date()`); useful for tests
 * @param skewMs - Server/device clock skew from {@link useServerTime}; defaults to 0
 */
export function formatSocialPostTime(
  value: string | null,
  now: Date = new Date(),
  skewMs = 0,
): string {
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

  // Wall-clock display + day comparisons use the user's device clock: shift the
  // true instants by skewMs and read them in the viewer's local timezone.
  const postLocal = new Date(post.getTime() - skewMs)
  const nowLocal = new Date(now.getTime() - skewMs)
  const sameDay = isSameLocalCalendarDay(postLocal, nowLocal)

  if (sameDay) {
    const hours = Math.floor(diffSec / 3600)
    if (hours < SAME_DAY_HOURS_AGO_CAP) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }
    return `Today at ${formatClock12h(postLocal)}`
  }

  if (isLocalCalendarYesterday(postLocal, nowLocal)) {
    return `Yesterday at ${formatClock12h(postLocal)}`
  }

  const includeYear = postLocal.getFullYear() !== nowLocal.getFullYear()
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
  return postLocal.toLocaleString('en-IN', opts)
}
