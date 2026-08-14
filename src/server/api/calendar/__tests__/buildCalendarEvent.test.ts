import { describe, expect, it } from 'vitest'
import type { CalendarEntityRow } from '../calendarTypes'
import { buildCalendarEvent, formatMsAsIstIso } from '../buildCalendarEvent'

const NOW_MS = Date.parse('2026-08-14T04:30:00Z') // 10:00 IST

const row = (over: Partial<CalendarEntityRow> = {}): CalendarEntityRow => ({
  id: 7,
  title: 'DSA Session',
  type: 'live',
  optional: 0,
  schedule: '2026-08-14 10:00:00',
  concludes: '2026-08-14 12:00:00',
  sectionId: 5,
  hostName: 'Prof. A',
  sectionName: 'Section A',
  batchName: 'FS Batch',
  sectionSettings: null,
  zoomLink: 'https://zoom.us/j/1',
  isNewZoomRedirection: 0,
  zoomDetails: null,
  ...over,
})

describe('buildCalendarEvent', () => {
  it('drops rows without a schedule', () => {
    expect(
      buildCalendarEvent({ row: row({ schedule: null }), type: 'lecture', nowMs: NOW_MS }),
    ).toBeNull()
  })

  it('handles rows the driver already stamped with +05:30 (no double stamp)', () => {
    // columnTypes.ts returns DATETIME columns pre-stamped; naive string
    // concatenation used to produce "…+05:30+05:30" and drop every event.
    const event = buildCalendarEvent({
      row: row({
        schedule: '2026-08-14T10:00:00+05:30',
        concludes: '2026-08-14T12:00:00+05:30',
      }),
      type: 'lecture',
      nowMs: NOW_MS,
    })
    expect(event?.schedule).toBe('2026-08-14T10:00:00+05:30')
    expect(event?.concludes).toBe('2026-08-14T12:00:00+05:30')
    expect(event?.effectiveEnd).toBe('2026-08-14T12:00:00+05:30')
  })

  it('nulls a concludes that is not after schedule (fallback owns the end)', () => {
    const event = buildCalendarEvent({
      row: row({ concludes: '2026-08-14 09:00:00' }),
      type: 'lecture',
      nowMs: NOW_MS,
    })
    expect(event?.concludes).toBeNull()
    expect(event?.effectiveEnd).toBe('2026-08-14T11:00:00+05:30')
  })

  it('stamps schedule/concludes as explicit IST and keeps concludes as the end', () => {
    const event = buildCalendarEvent({ row: row(), type: 'lecture', nowMs: NOW_MS })
    expect(event?.schedule).toBe('2026-08-14T10:00:00+05:30')
    expect(event?.concludes).toBe('2026-08-14T12:00:00+05:30')
    expect(event?.effectiveEnd).toBe('2026-08-14T12:00:00+05:30')
  })

  it.each([
    ['lecture', '2026-08-14T11:00:00+05:30'],
    ['assignment', '2026-08-15T10:00:00+05:30'],
    ['quiz', '2026-08-14T12:00:00+05:30'],
  ] as const)('falls back to the %s duration when concludes is null', (type, end) => {
    const event = buildCalendarEvent({
      row: row({ concludes: null }),
      type,
      nowMs: NOW_MS,
    })
    expect(event?.concludes).toBeNull()
    expect(event?.effectiveEnd).toBe(end)
  })

  it('applies the fallback when concludes is not after schedule', () => {
    const event = buildCalendarEvent({
      row: row({ concludes: '2026-08-14 10:00:00' }),
      type: 'lecture',
      nowMs: NOW_MS,
    })
    expect(event?.effectiveEnd).toBe('2026-08-14T11:00:00+05:30')
  })

  it('links lectures and assignments to their detail pages, quizzes to none', () => {
    expect(
      buildCalendarEvent({ row: row(), type: 'lecture', nowMs: NOW_MS })?.detailPath,
    ).toBe('/lectures/7')
    expect(
      buildCalendarEvent({ row: row(), type: 'assignment', nowMs: NOW_MS })?.detailPath,
    ).toBe('/assignments/7')
    expect(
      buildCalendarEvent({ row: row(), type: 'quiz', nowMs: NOW_MS })?.detailPath,
    ).toBeNull()
  })

  it('surfaces an active join CTA for a live lecture in its window', () => {
    const event = buildCalendarEvent({ row: row(), type: 'lecture', nowMs: NOW_MS })
    expect(event?.joinLive?.state).toBe('active')
    expect(event?.joinLive?.joinZoomLink).toBe('https://zoom.us/j/1')
  })

  it('hides joinLive for non-live lectures and non-lectures', () => {
    expect(
      buildCalendarEvent({ row: row({ type: 'recorded' }), type: 'lecture', nowMs: NOW_MS })
        ?.joinLive,
    ).toBeNull()
    expect(
      buildCalendarEvent({ row: row(), type: 'assignment', nowMs: NOW_MS })?.joinLive,
    ).toBeNull()
    expect(
      buildCalendarEvent({ row: row(), type: 'quiz', nowMs: NOW_MS })?.hostName,
    ).toBeNull()
  })

  it('maps optional flag', () => {
    expect(
      buildCalendarEvent({ row: row({ optional: 1 }), type: 'quiz', nowMs: NOW_MS })
        ?.optional,
    ).toBe(true)
  })
})

describe('formatMsAsIstIso', () => {
  it('renders an epoch instant as IST wall clock', () => {
    expect(formatMsAsIstIso(Date.parse('2026-08-14T04:30:00Z'))).toBe(
      '2026-08-14T10:00:00+05:30',
    )
  })
})
