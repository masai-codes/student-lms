import { afterEach, describe, expect, it } from 'vitest'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'
import { eventsOnDay, mapCalendarEvents } from './calendarEventMapping'

const dto = (over: Partial<CalendarEventDto> = {}): CalendarEventDto => ({
  id: 7,
  type: 'lecture',
  title: 'DSA Session',
  schedule: '2026-08-14T10:00:00+05:30',
  concludes: '2026-08-14T12:00:00+05:30',
  effectiveEnd: '2026-08-14T12:00:00+05:30',
  optional: false,
  sectionId: 5,
  sectionName: null,
  batchName: null,
  hostName: null,
  detailPath: '/lectures/7',
  joinLive: null,
  ...over,
})

const ORIGINAL_TZ = process.env.TZ

afterEach(() => {
  process.env.TZ = ORIGINAL_TZ
})

describe('mapCalendarEvents', () => {
  it('maps DTOs to absolute instants with a unique key', () => {
    const [event] = mapCalendarEvents([dto()])
    expect(event.key).toBe('lecture-7')
    expect(event.start.toISOString()).toBe('2026-08-14T04:30:00.000Z')
    expect(event.end.toISOString()).toBe('2026-08-14T06:30:00.000Z')
    expect(event.allDay).toBe(false)
  })

  it('marks assignments as all-day lane events', () => {
    const [event] = mapCalendarEvents([dto({ type: 'assignment' })])
    expect(event.allDay).toBe(true)
  })

  it('skips events with unparseable times', () => {
    expect(mapCalendarEvents([dto({ schedule: 'garbage' })])).toEqual([])
  })

  it('places a late-IST event on the previous local day for a US viewer', () => {
    process.env.TZ = 'America/New_York'
    // 01:00 IST on the 14th = 15:30 on the 13th in New York (EDT).
    const events = mapCalendarEvents([
      dto({
        schedule: '2026-08-14T01:00:00+05:30',
        effectiveEnd: '2026-08-14T02:00:00+05:30',
      }),
    ])
    expect(eventsOnDay(events, '2026-08-13')).toHaveLength(1)
    expect(eventsOnDay(events, '2026-08-14')).toHaveLength(0)
  })
})

describe('eventsOnDay', () => {
  it('includes events overlapping the day from either side', () => {
    const events = mapCalendarEvents([
      dto({
        schedule: '2026-08-13T23:00:00+05:30',
        effectiveEnd: '2026-08-14T01:00:00+05:30',
      }),
    ])
    expect(eventsOnDay(events, '2026-08-13')).toHaveLength(1)
    expect(eventsOnDay(events, '2026-08-14')).toHaveLength(1)
    expect(eventsOnDay(events, '2026-08-15')).toHaveLength(0)
  })
})
