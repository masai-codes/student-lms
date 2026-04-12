/**
 * Formats post/reply timestamps in a social-feed style using the user's local timezone.
 * See docs/masaiverse-discussion-relative-time.md for the full rules.
 */

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isLocalCalendarYesterday(post: Date, now: Date): boolean {
  const postDay = new Date(post.getFullYear(), post.getMonth(), post.getDate()).getTime()
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return nowDay - postDay === 86400000
}

function formatClock12h(d: Date): string {
  return d.toLocaleTimeString(undefined, {
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

  const post = new Date(value)
  if (Number.isNaN(post.getTime())) {
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

  const sameDay = isSameLocalCalendarDay(post, now)

  if (sameDay) {
    const hours = Math.floor(diffSec / 3600)
    if (hours < SAME_DAY_HOURS_AGO_CAP) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }
    return `Today at ${formatClock12h(post)}`
  }

  if (isLocalCalendarYesterday(post, now)) {
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
  return post.toLocaleString(undefined, opts)
}
