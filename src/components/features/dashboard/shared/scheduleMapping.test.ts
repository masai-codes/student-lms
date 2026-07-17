import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildScheduleWeek,
  scheduleItemToLearnContent,
} from './scheduleMapping'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'

/**
 * The schedule grid and item bucketing are viewer-local, so these tests pin the
 * process timezone to keep them deterministic across machines/CI. Node honors
 * runtime `process.env.TZ` changes for subsequent `Date` operations.
 */
function pinTimezone(tz: string) {
  let original: string | undefined
  beforeAll(() => {
    original = process.env.TZ
    process.env.TZ = tz
  })
  afterAll(() => {
    process.env.TZ = original
  })
}

const item = (
  over: Partial<DashboardScheduleItem> = {},
): DashboardScheduleItem => ({
  id: 1,
  learningType: 'lecture',
  title: 'Workshop',
  hostName: 'Prof. A',
  scheduleDate: '2026-07-03 18:30:00',
  concludes: '2026-07-03 19:30:00',
  type: 'live',
  category: 'IIM-M DM',
  isOptional: 'mandatory',
  moduleName: 'Module 1',
  attendance: null,
  optionalAttendance: null,
  assignmentProgressStatus: null,
  resourcePhase: null,
  listingCtas: {
    joinLive: 'active',
    joinZoomLink: null,
    isNewZoomRedirection: false,
    enableZoomWebView: false,
    showAttendance: false,
    assignmentStatusChip: null,
    assignmentDeadlineLabel: null,
    assignmentScore: null,
  },
  courseName: 'Full Stack',
  enableZoomWebView: false,
  ...over,
})

describe('scheduleItemToLearnContent', () => {
  it('maps to the learn card shape with a compact date range, tags and courseName', () => {
    const result = scheduleItemToLearnContent(item())
    expect(result).toMatchObject({
      id: 1,
      type: 'lecture',
      title: 'Workshop',
      learningSubType: 'live',
      priority: 'mandatory',
      // Tags trimmed to category + module for the compact card.
      tags: ['IIM-M DM', 'Module 1'],
      assignmentStatusChip: null,
      courseName: 'Full Stack',
    })
    // IST tooltip is deterministic (device-tz independent); the DB value is IST.
    expect(result.dateTooltip).toBe('3 Jul, 6:30 PM - 7:30 PM (IST)')
    expect(result.date).toBeTruthy()
  })
})

describe('buildScheduleWeek (IST viewer)', () => {
  pinTimezone('Asia/Kolkata')
  // 06:30 UTC = 12:00 IST on 2026-07-02 (a Thursday).
  const NOW = new Date('2026-07-02T06:30:00Z')

  it('renders 7 days from today with a range label; today is flagged', () => {
    const week = buildScheduleWeek([], NOW)
    expect(week.rangeLabel).toBe('Jul 02 - 08')
    expect(week.days).toHaveLength(7)
    expect(week.days[0]).toMatchObject({
      key: '2026-07-02',
      weekday: 'Thu',
      dayOfMonth: '02',
      isToday: true,
    })
    expect(week.days[6]).toMatchObject({
      key: '2026-07-08',
      dayOfMonth: '08',
      isToday: false,
    })
    expect(week.days.every((d, i) => (i === 0 ? d.isToday : !d.isToday))).toBe(
      true,
    )
  })

  it('places each item on its local day; empty days stay empty', () => {
    // For an IST viewer the local day equals the IST wall-clock date component.
    const week = buildScheduleWeek(
      [
        item({ id: 1, scheduleDate: '2026-07-05 11:30:00' }),
        item({ id: 2, scheduleDate: '2026-07-03 20:00:00' }),
      ],
      NOW,
    )
    const byKey = Object.fromEntries(
      week.days.map((d) => [d.key, d.items.map((i) => i.id)]),
    )
    expect(byKey['2026-07-03']).toEqual([2])
    expect(byKey['2026-07-05']).toEqual([1])
    expect(byKey['2026-07-02']).toEqual([])
  })

  it('lectures span a single day even with a concludes on another day', () => {
    const week = buildScheduleWeek(
      [
        item({
          id: 1,
          learningType: 'lecture',
          scheduleDate: '2026-07-03 20:00:00',
          concludes: '2026-07-06 20:00:00',
        }),
      ],
      NOW,
    )
    const byKey = Object.fromEntries(
      week.days.map((d) => [d.key, d.items.map((i) => i.id)]),
    )
    expect(byKey['2026-07-03']).toEqual([1])
    expect(byKey['2026-07-04']).toEqual([])
    expect(byKey['2026-07-06']).toEqual([])
  })

  it('pins an active multi-day assignment to today only, not every day in its span', () => {
    // Assignment already running (2026-06-20 → 2026-07-10); today is 2026-07-02.
    const week = buildScheduleWeek(
      [
        item({
          id: 7,
          learningType: 'assignment',
          scheduleDate: '2026-06-20 13:00:00',
          concludes: '2026-07-10 13:00:00',
        }),
      ],
      NOW,
    )
    const byKey = Object.fromEntries(
      week.days.map((d) => [d.key, d.items.map((i) => i.id)]),
    )
    expect(byKey['2026-07-02']).toEqual([7]) // today only
    expect(byKey['2026-07-03']).toEqual([])
    expect(byKey['2026-07-08']).toEqual([])
  })

  it('shows a not-yet-started assignment on its start day', () => {
    // Assignment starts in the future (2026-07-05 → 2026-07-09); today is 07-02.
    const week = buildScheduleWeek(
      [
        item({
          id: 8,
          learningType: 'assignment',
          scheduleDate: '2026-07-05 13:00:00',
          concludes: '2026-07-09 13:00:00',
        }),
      ],
      NOW,
    )
    const byKey = Object.fromEntries(
      week.days.map((d) => [d.key, d.items.map((i) => i.id)]),
    )
    expect(byKey['2026-07-02']).toEqual([]) // not started yet
    expect(byKey['2026-07-05']).toEqual([8]) // start day
    expect(byKey['2026-07-06']).toEqual([])
  })

  it('drops an assignment whose deadline has already passed', () => {
    // Assignment concluded before today (2026-06-20 → 2026-06-30); today 07-02.
    const week = buildScheduleWeek(
      [
        item({
          id: 9,
          learningType: 'assignment',
          scheduleDate: '2026-06-20 13:00:00',
          concludes: '2026-06-30 13:00:00',
        }),
      ],
      NOW,
    )
    const shown = week.days.flatMap((d) => d.items.map((i) => i.id))
    expect(shown).toEqual([])
  })
})

describe('buildScheduleWeek (non-IST viewer)', () => {
  // America/New_York is UTC-4 in July (EDT), i.e. 9.5h behind IST.
  pinTimezone('America/New_York')

  it('buckets and labels days in the viewer local timezone, not IST', () => {
    // 2026-07-09T00:30:00Z = 2026-07-08 20:30 EDT (local) = 2026-07-09 06:00 IST.
    // Locally it is still July 8, so "today" must be the 8th, not the 9th.
    const NOW = new Date('2026-07-09T00:30:00Z')
    const week = buildScheduleWeek([], NOW)
    expect(week.days[0]).toMatchObject({ key: '2026-07-08', isToday: true })
    expect(week.days[1]).toMatchObject({ key: '2026-07-09', isToday: false })
  })

  it('places an early-IST-morning item under the local day its card renders', () => {
    // The bug: an item at 02:00 IST on Jul 9 is 16:30 EDT on Jul 8 locally.
    // It must appear under the Jul 8 row (matching its card date), not Jul 9.
    const NOW = new Date('2026-07-08T12:00:00Z') // 08:00 EDT, Jul 8 local
    const week = buildScheduleWeek(
      [item({ id: 1, scheduleDate: '2026-07-09 02:00:00' })],
      NOW,
    )
    const byKey = Object.fromEntries(
      week.days.map((d) => [d.key, d.items.map((i) => i.id)]),
    )
    expect(byKey['2026-07-08']).toEqual([1])
    expect(byKey['2026-07-09']).toEqual([])
  })
})
