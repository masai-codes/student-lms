import { describe, expect, it } from 'vitest'

import { LEARN_KEYS, serializeLearnPageFiltersKey } from '@/query/learn/learnQueries'

describe('serializeLearnPageFiltersKey', () => {
  it('returns empty string when no filters are applied', () => {
    expect(serializeLearnPageFiltersKey()).toBe('')
    expect(serializeLearnPageFiltersKey(undefined)).toBe('')
  })

  it('includes attendanceStatus so present/absent changes bust the cache', () => {
    const withTypeOnly = serializeLearnPageFiltersKey({ types: ['live'] })
    const withTypeAndAttendance = serializeLearnPageFiltersKey({
      types: ['live'],
      attendanceStatus: 'present',
    })

    expect(withTypeOnly).not.toBe(withTypeAndAttendance)
  })
})

describe('LEARN_KEYS.page', () => {
  it('produces different keys when lecture filters change', () => {
    const base = { batchId: 1, learningType: 'lecture' as const, page: 1 }

    const unfiltered = LEARN_KEYS.page(base)
    const liveOnly = LEARN_KEYS.page({
      ...base,
      filters: { types: ['live'] },
    })
    const livePresent = LEARN_KEYS.page({
      ...base,
      filters: { types: ['live'], attendanceStatus: 'present' },
    })

    expect(unfiltered).not.toEqual(liveOnly)
    expect(liveOnly).not.toEqual(livePresent)
  })
})
