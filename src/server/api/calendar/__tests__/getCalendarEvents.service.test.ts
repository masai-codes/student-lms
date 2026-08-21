import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEntityRow } from '../calendarTypes'

import { getCalendarEvents } from '../getCalendarEvents.service'

const hoisted = vi.hoisted(() => ({
  getSectionIds: vi.fn(),
  getBatchIds: vi.fn(),
  getRestrictions: vi.fn(),
  getBatchIdsForSections: vi.fn(),
  fetchLectures: vi.fn(),
  fetchAssignments: vi.fn(),
  fetchQuizzes: vi.fn(),
}))

vi.mock('@/server/batches/getSectionIdsForUser', () => ({
  getSectionIdsForUser: hoisted.getSectionIds,
}))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIds,
}))
vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: hoisted.getRestrictions,
}))
vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdsForSections: hoisted.getBatchIdsForSections,
}))
vi.mock('../fetchCalendarLectures.service', () => ({
  fetchCalendarLectures: hoisted.fetchLectures,
}))
vi.mock('../fetchCalendarAssignments.service', () => ({
  fetchCalendarAssignments: hoisted.fetchAssignments,
}))
vi.mock('../fetchCalendarQuizzes.service', () => ({
  fetchCalendarQuizzes: hoisted.fetchQuizzes,
}))

const NOW = new Date('2026-08-14T04:30:00Z')
const WINDOW = { start: '2026-08-10', end: '2026-08-16' }

const row = (over: Partial<CalendarEntityRow> = {}): CalendarEntityRow => ({
  id: 1,
  title: 'Event',
  type: 'live',
  optional: 0,
  schedule: '2026-08-12 10:00:00',
  concludes: '2026-08-12 11:00:00',
  sectionId: 5,
  hostName: null,
  sectionName: null,
  batchName: null,
  sectionSettings: null,
  zoomLink: null,
  isNewZoomRedirection: null,
  zoomDetails: null,
  ...over,
})

describe('getCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSectionIds.mockResolvedValue([5, 6])
    hoisted.getBatchIds.mockResolvedValue([1, 2])
    hoisted.getRestrictions.mockResolvedValue(new Map())
    hoisted.getBatchIdsForSections.mockResolvedValue(
      new Map([
        [5, 1],
        [6, 2],
      ]),
    )
    hoisted.fetchLectures.mockResolvedValue([])
    hoisted.fetchAssignments.mockResolvedValue([])
    hoisted.fetchQuizzes.mockResolvedValue([])
  })

  it('returns empty without fetching when the user has no sections', async () => {
    hoisted.getSectionIds.mockResolvedValue([])
    const result = await getCalendarEvents(9, WINDOW, null, NOW)
    expect(result.events).toEqual([])
    expect(hoisted.fetchLectures).not.toHaveBeenCalled()
  })

  it('queries all sections with the padded window when no batch filter is set', async () => {
    await getCalendarEvents(9, WINDOW, null, NOW)
    expect(hoisted.fetchLectures).toHaveBeenCalledWith([5, 6], {
      start: '2026-08-09',
      end: '2026-08-17',
    })
  })

  it('narrows sections to the requested enrolled batch', async () => {
    await getCalendarEvents(9, WINDOW, 2, NOW)
    expect(hoisted.fetchLectures).toHaveBeenCalledWith([6], expect.anything())
  })

  it('returns empty for a batch the user is not enrolled in (never leaks)', async () => {
    const result = await getCalendarEvents(9, WINDOW, 999, NOW)
    expect(result.events).toEqual([])
    expect(hoisted.fetchLectures).not.toHaveBeenCalled()
  })

  it('merges the three sources sorted soonest-first with type tags', async () => {
    hoisted.fetchLectures.mockResolvedValue([
      row({
        id: 1,
        schedule: '2026-08-13 10:00:00',
        concludes: '2026-08-13 11:00:00',
      }),
    ])
    hoisted.fetchAssignments.mockResolvedValue([
      row({
        id: 2,
        type: 'evaluation',
        schedule: '2026-08-11 09:00:00',
        concludes: null,
      }),
    ])
    hoisted.fetchQuizzes.mockResolvedValue([
      row({
        id: 3,
        type: 'quiz',
        schedule: '2026-08-12 09:00:00',
        concludes: null,
      }),
    ])
    const result = await getCalendarEvents(9, WINDOW, null, NOW)
    expect(result.events.map((e) => `${e.type}-${e.id}`)).toEqual([
      'assignment-2',
      'quiz-3',
      'lecture-1',
    ])
    expect(result.range).toEqual(WINDOW)
  })

  it('drops rows in cancelled batches via the restriction filter', async () => {
    hoisted.getRestrictions.mockResolvedValue(
      new Map([[1, { enrolmentCancelled: true, paused: false }]]),
    )
    hoisted.fetchLectures.mockResolvedValue([
      row({ id: 1, sectionId: 5 }),
      row({ id: 2, sectionId: 6 }),
    ])
    const result = await getCalendarEvents(9, WINDOW, null, NOW)
    expect(result.events.map((e) => e.id)).toEqual([2])
  })

  it('drops rows without a schedule and rows outside the exact window', async () => {
    hoisted.fetchLectures.mockResolvedValue([
      row({ id: 1, schedule: null }),
      // Padded window ends 2026-08-17 23:59:59 IST — this starts after it.
      row({ id: 2, schedule: '2026-08-18 10:00:00', concludes: null }),
      row({ id: 3 }),
    ])
    const result = await getCalendarEvents(9, WINDOW, null, NOW)
    expect(result.events.map((e) => e.id)).toEqual([3])
  })

  it('keeps an event spanning the entire window (overlap semantics)', async () => {
    hoisted.fetchAssignments.mockResolvedValue([
      row({
        id: 4,
        type: 'evaluation',
        schedule: '2026-08-01 00:00:00',
        concludes: '2026-08-31 23:59:00',
      }),
    ])
    const result = await getCalendarEvents(9, WINDOW, null, NOW)
    expect(result.events.map((e) => e.id)).toEqual([4])
  })
})
