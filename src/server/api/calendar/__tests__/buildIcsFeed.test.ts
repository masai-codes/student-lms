import { describe, expect, it } from 'vitest'
import type { CalendarEventDto } from '../calendarTypes'
import { buildIcsFeed } from '../buildIcsFeed'

const event = (over: Partial<CalendarEventDto> = {}): CalendarEventDto => ({
  id: 7,
  type: 'lecture',
  title: 'DSA Session',
  schedule: '2026-08-14T10:00:00+05:30',
  concludes: '2026-08-14T12:00:00+05:30',
  effectiveEnd: '2026-08-14T12:00:00+05:30',
  optional: false,
  sectionId: 5,
  sectionName: 'Section A',
  batchName: 'FS Batch',
  hostName: 'Prof. A',
  detailPath: '/lectures/7',
  joinLive: null,
  ...over,
})

const NOW = new Date('2026-08-14T00:00:00Z')
const ORIGIN = 'https://lms.example.com'

describe('buildIcsFeed', () => {
  it('emits a valid VCALENDAR wrapper', () => {
    const ics = buildIcsFeed({ events: [], origin: ORIGIN, now: NOW })
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('X-WR-CALNAME:Masai Schedule')
  })

  it('converts IST stamps to true UTC DTSTART/DTEND', () => {
    const ics = buildIcsFeed({ events: [event()], origin: ORIGIN, now: NOW })
    expect(ics).toContain('DTSTART:20260814T043000Z')
    expect(ics).toContain('DTEND:20260814T063000Z')
    expect(ics).toContain('UID:lecture-7@masai-student-lms')
    expect(ics).toContain(`URL:${ORIGIN}/lectures/7`)
  })

  it('prefixes non-lecture summaries and omits URL when there is no detail path', () => {
    const ics = buildIcsFeed({
      events: [
        event({
          type: 'quiz',
          title: 'Weekly Quiz',
          detailPath: null,
          hostName: null,
        }),
      ],
      origin: ORIGIN,
      now: NOW,
    })
    expect(ics).toContain('SUMMARY:Quiz: Weekly Quiz')
    expect(ics).not.toContain('URL:')
  })

  it('escapes commas/semicolons/newlines in text fields', () => {
    const ics = buildIcsFeed({
      events: [event({ title: 'A, B; C\nD' })],
      origin: ORIGIN,
      now: NOW,
    })
    expect(ics).toContain('SUMMARY:A\\, B\\; C\\nD')
  })

  it('folds lines longer than 75 octets with a leading space', () => {
    const ics = buildIcsFeed({
      events: [event({ title: 'X'.repeat(120) })],
      origin: ORIGIN,
      now: NOW,
    })
    const folded = ics.split('\r\n').findIndex((line) => line.startsWith(' '))
    expect(folded).toBeGreaterThan(-1)
    for (const line of ics.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75)
    }
  })

  it('skips events with unparseable times', () => {
    const ics = buildIcsFeed({
      events: [event({ schedule: 'garbage' })],
      origin: ORIGIN,
      now: NOW,
    })
    expect(ics).not.toContain('BEGIN:VEVENT')
  })
})
