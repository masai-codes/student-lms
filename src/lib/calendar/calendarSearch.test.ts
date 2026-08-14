import { describe, expect, it } from 'vitest'
import { parseCalendarSearch } from './calendarSearch'

describe('parseCalendarSearch', () => {
  it('parses valid values', () => {
    expect(
      parseCalendarSearch({ view: 'month', date: '2026-08-14', batchId: '3' }),
    ).toEqual({ view: 'month', date: '2026-08-14', batchId: 3 })
  })

  it('omits the default week view so URLs stay clean', () => {
    expect(parseCalendarSearch({ view: 'week' }).view).toBeUndefined()
  })

  it('drops unknown views', () => {
    expect(parseCalendarSearch({ view: 'agenda' }).view).toBeUndefined()
    expect(parseCalendarSearch({ view: 42 }).view).toBeUndefined()
  })

  it('drops malformed and impossible dates', () => {
    expect(parseCalendarSearch({ date: 'next-week' }).date).toBeUndefined()
    expect(parseCalendarSearch({ date: '2026-8-1' }).date).toBeUndefined()
    expect(parseCalendarSearch({ date: '2026-02-31' }).date).toBeUndefined()
  })

  it('drops non-positive batch ids', () => {
    expect(parseCalendarSearch({ batchId: '0' }).batchId).toBeUndefined()
    expect(parseCalendarSearch({ batchId: '-2' }).batchId).toBeUndefined()
    expect(parseCalendarSearch({ batchId: 'abc' }).batchId).toBeUndefined()
  })

  it('returns all-undefined for an empty search', () => {
    expect(parseCalendarSearch({})).toEqual({
      view: undefined,
      date: undefined,
      batchId: undefined,
    })
  })
})
