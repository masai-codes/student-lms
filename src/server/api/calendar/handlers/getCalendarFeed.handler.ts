import { buildIcsFeed } from '@/server/api/calendar/buildIcsFeed'
import { findUserIdByCalendarToken } from '@/server/api/calendar/getCalendarSubscription.service'
import { getCalendarEvents } from '@/server/api/calendar/getCalendarEvents.service'

/** Feed span around "now" — a month back for context, three months ahead. */
const FEED_LOOKBACK_DAYS = 30
const FEED_LOOKAHEAD_DAYS = 90
const DAY_MS = 86_400_000

/**
 * Public ICS feed — the token in the path is the credential (calendar apps
 * poll without cookies). Unknown tokens 404 without detail. The feed reuses
 * the same event service as the page, so restrictions and scoping apply
 * identically.
 */
export async function handleGetCalendarFeed(
  rawToken: string,
  request?: Request,
): Promise<Response> {
  try {
    const token = rawToken.replace(/\.ics$/i, '')
    const userId = await findUserIdByCalendarToken(token)
    if (userId == null) {
      return new Response('Not found', { status: 404 })
    }

    const now = new Date()
    const window = {
      start: toDateString(now.getTime() - FEED_LOOKBACK_DAYS * DAY_MS),
      end: toDateString(now.getTime() + FEED_LOOKAHEAD_DAYS * DAY_MS),
    }
    // MAX_CALENDAR_WINDOW_DAYS caps the page's requests, not this trusted span.
    const { events } = await getCalendarEvents(userId, window, null, now)

    const origin = resolveAppOrigin(request)
    const body = buildIcsFeed({ events, origin, now })
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="masai-schedule.ics"',
        'Cache-Control': 'private, max-age=900',
      },
    })
  } catch (error) {
    console.error('Failed to serve calendar feed', error)
    return new Response('Internal server error', { status: 500 })
  }
}

function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/**
 * Deep-link origin for VEVENT URLs. Taken from the incoming request so each
 * environment links to itself (a demo subscription must not deep-link into
 * production); `APP_PUBLIC_ORIGIN` overrides when the public host differs from
 * what the app sees behind a proxy.
 */
function resolveAppOrigin(request?: Request): string {
  const configured = process.env.APP_PUBLIC_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (request) {
    try {
      return new URL(request.url).origin
    } catch {
      // Fall through to the default host below.
    }
  }
  return 'https://students.masaischool.com'
}
