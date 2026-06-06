import { describe, expect, it } from 'vitest'
import {
  getEventBucket,
  matchesScope,
  matchesSearch,
  sortForBucket,
} from './eventBuckets'
import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'

const NOW = new Date('2026-06-03T12:00:00Z')

function makeEvent(
  overrides: Partial<MasaiverseV2EventListItem> = {},
): MasaiverseV2EventListItem {
  return {
    id: '1',
    imageUrl: null,
    aboveTitle: null,
    title: 'Event',
    belowTitle: null,
    category: null,
    mode: null,
    locationTitle: null,
    clubId: null,
    clubName: null,
    startTime: null,
    endTime: null,
    isEnrolled: false,
    ...overrides,
  }
}

describe('getEventBucket', () => {
  it('buckets live and upcoming events as upcoming', () => {
    const live = makeEvent({
      startTime: '2026-06-03T11:00:00Z',
      endTime: '2026-06-03T13:00:00Z',
    })
    const upcoming = makeEvent({ startTime: '2026-06-10T11:00:00Z' })
    expect(getEventBucket(live, NOW)).toBe('upcoming')
    expect(getEventBucket(upcoming, NOW)).toBe('upcoming')
  })

  it('buckets completed events as past', () => {
    const past = makeEvent({
      startTime: '2026-05-01T11:00:00Z',
      endTime: '2026-05-01T13:00:00Z',
    })
    expect(getEventBucket(past, NOW)).toBe('past')
  })
})

describe('matchesScope', () => {
  const publicEvent = makeEvent({ clubId: null })
  const clubEvent = makeEvent({ clubId: '7' })

  it('keeps everything for the "all" scope', () => {
    expect(matchesScope(publicEvent, 'all')).toBe(true)
    expect(matchesScope(clubEvent, 'all')).toBe(true)
  })

  it('keeps only club-less events for "public"', () => {
    expect(matchesScope(publicEvent, 'public')).toBe(true)
    expect(matchesScope(clubEvent, 'public')).toBe(false)
  })

  it('keeps only club-hosted events for "clubs"', () => {
    expect(matchesScope(clubEvent, 'clubs')).toBe(true)
    expect(matchesScope(publicEvent, 'clubs')).toBe(false)
  })
})

describe('matchesSearch', () => {
  const event = makeEvent({
    title: 'React Hackathon',
    clubName: 'Frontend Club',
    locationTitle: 'Pune',
    aboveTitle: 'FLAGSHIP',
  })

  it('matches any event when the query is blank', () => {
    expect(matchesSearch(event, '   ')).toBe(true)
  })

  it('matches across title, club, location, and above-title (case-insensitive)', () => {
    expect(matchesSearch(event, 'react')).toBe(true)
    expect(matchesSearch(event, 'frontend')).toBe(true)
    expect(matchesSearch(event, 'pune')).toBe(true)
    expect(matchesSearch(event, 'flagship')).toBe(true)
  })

  it('ignores null fields and returns false on no match', () => {
    const sparse = makeEvent({ title: 'Solo', clubName: null })
    expect(matchesSearch(sparse, 'club')).toBe(false)
  })
})

describe('sortForBucket', () => {
  const early = makeEvent({ id: 'early', startTime: '2026-06-01T10:00:00Z' })
  const late = makeEvent({ id: 'late', startTime: '2026-06-09T10:00:00Z' })
  const endOnly = makeEvent({ id: 'endOnly', endTime: '2026-06-05T10:00:00Z' })
  const timeless = makeEvent({ id: 'timeless' })

  it('orders upcoming soonest-first and sinks timeless events', () => {
    const result = sortForBucket([timeless, late, early], 'upcoming')
    expect(result.map((e) => e.id)).toEqual(['early', 'late', 'timeless'])
  })

  it('orders past most-recent-first and sinks timeless events', () => {
    const result = sortForBucket([timeless, early, late], 'past')
    expect(result.map((e) => e.id)).toEqual(['late', 'early', 'timeless'])
  })

  it('falls back to end time when start is missing', () => {
    const result = sortForBucket([late, endOnly, early], 'upcoming')
    expect(result.map((e) => e.id)).toEqual(['early', 'endOnly', 'late'])
  })

  it('keeps order stable when both events are timeless', () => {
    const a = makeEvent({ id: 'a' })
    const b = makeEvent({ id: 'b' })
    expect(sortForBucket([a, b], 'upcoming').map((e) => e.id)).toEqual([
      'a',
      'b',
    ])
  })

  it('treats an unparseable timestamp like a timeless event', () => {
    const bad = makeEvent({ id: 'bad', startTime: 'not-a-date' })
    const result = sortForBucket([bad, early], 'upcoming')
    expect(result.map((e) => e.id)).toEqual(['early', 'bad'])
  })
})
