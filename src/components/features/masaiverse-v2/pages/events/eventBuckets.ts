import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'
import { getEventStatus } from '@/lib/masaiverseEventCard'

/** Time axis: events that haven't finished vs. events that already happened. */
export type EventTimeBucket = 'upcoming' | 'past'
/** Host axis: everything, public (no club) only, or club-hosted only. */
export type EventScopeFilter = 'all' | 'public' | 'clubs'

/** Live + upcoming events fall under "upcoming"; completed ones under "past". */
export function getEventBucket(
  event: MasaiverseV2EventListItem,
  now: Date,
): EventTimeBucket {
  return getEventStatus(event, now) === 'completed' ? 'past' : 'upcoming'
}

export function matchesScope(
  event: MasaiverseV2EventListItem,
  scope: EventScopeFilter,
): boolean {
  if (scope === 'public') return event.clubId == null
  if (scope === 'clubs') return event.clubId != null
  return true
}

export function matchesSearch(
  event: MasaiverseV2EventListItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [event.title, event.clubName, event.locationTitle, event.aboveTitle]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(q))
}

/** Milliseconds basis for ordering — start time, falling back to end time. */
function timeBasisMs(event: MasaiverseV2EventListItem): number | null {
  const basis = event.startTime ?? event.endTime
  if (!basis) return null
  const ms = new Date(basis).getTime()
  return Number.isNaN(ms) ? null : ms
}

/**
 * Orders a single bucket the way a community member scans it:
 * - upcoming → soonest first (live events sort to the very top because they've
 *   already started), so the next thing to attend leads.
 * - past → most recent first, so the latest recap leads.
 *
 * Events without any timestamp sink to the end of either bucket.
 */
export function sortForBucket(
  events: Array<MasaiverseV2EventListItem>,
  bucket: EventTimeBucket,
): Array<MasaiverseV2EventListItem> {
  const direction = bucket === 'upcoming' ? 1 : -1
  return [...events].sort((a, b) => {
    const aMs = timeBasisMs(a)
    const bMs = timeBasisMs(b)
    if (aMs == null && bMs == null) return 0
    if (aMs == null) return 1
    if (bMs == null) return -1
    return (aMs - bMs) * direction
  })
}
