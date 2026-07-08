import { describe, expect, it, vi } from 'vitest'

// batchBan.ts imports `@/db` at module load; stub it so the pure helpers can be tested.
vi.mock('@/db', () => ({ db: {} }))

import {
  isScheduledAfterBanCutoff,
  makeNormalBanScheduleFilter,
  normalizeBanCutoff,
} from '../batchBan'

describe('normalizeBanCutoff', () => {
  it('pushes a date-only value to end of that day', () => {
    expect(normalizeBanCutoff('2026-07-01')).toBe('2026-07-01 23:59:59')
  })

  it('keeps a full datetime and normalises the separator', () => {
    expect(normalizeBanCutoff('2026-07-01 10:30:00')).toBe('2026-07-01 10:30:00')
    expect(normalizeBanCutoff('2026-07-01T10:30:00')).toBe('2026-07-01 10:30:00')
  })

  it('pads a missing seconds component', () => {
    expect(normalizeBanCutoff('2026-07-01 10:30')).toBe('2026-07-01 10:30:00')
  })

  it('falls back to the restrict-all sentinel for missing/invalid input', () => {
    expect(normalizeBanCutoff('')).toBe('')
    expect(normalizeBanCutoff('   ')).toBe('')
    expect(normalizeBanCutoff(null)).toBe('')
    expect(normalizeBanCutoff(undefined)).toBe('')
    expect(normalizeBanCutoff(20260701)).toBe('')
  })
})

describe('isScheduledAfterBanCutoff', () => {
  const cutoff = '2026-07-01 23:59:59'

  it('is true only when strictly after the cutoff', () => {
    expect(isScheduledAfterBanCutoff('2026-07-02 00:00:00', cutoff)).toBe(true)
    expect(isScheduledAfterBanCutoff('2026-07-01 23:59:59', cutoff)).toBe(false)
    expect(isScheduledAfterBanCutoff('2026-07-01 10:00:00', cutoff)).toBe(false)
  })

  it('treats items with no schedule as not-after', () => {
    expect(isScheduledAfterBanCutoff(null, cutoff)).toBe(false)
    expect(isScheduledAfterBanCutoff('', cutoff)).toBe(false)
  })

  it('restrict-all cutoff hides every scheduled item but keeps unscheduled ones', () => {
    expect(isScheduledAfterBanCutoff('2020-01-01 00:00:00', '')).toBe(true)
    expect(isScheduledAfterBanCutoff(null, '')).toBe(false)
  })
})

describe('makeNormalBanScheduleFilter', () => {
  const normalByBatch = new Map([[10, '2026-07-01 23:59:59']])
  const sectionToBatch = new Map([
    [5, 10], // banned batch
    [6, 20], // non-banned batch
  ])
  const keep = makeNormalBanScheduleFilter(normalByBatch, sectionToBatch)

  it('hides rows scheduled after the cutoff in a banned batch', () => {
    expect(keep({ sectionId: 5, schedule: '2026-07-02 09:00:00' })).toBe(false)
  })

  it('keeps rows scheduled on/before the cutoff in a banned batch', () => {
    expect(keep({ sectionId: 5, schedule: '2026-07-01 09:00:00' })).toBe(true)
  })

  it('keeps rows in a non-banned batch regardless of schedule', () => {
    expect(keep({ sectionId: 6, schedule: '2027-01-01 09:00:00' })).toBe(true)
  })

  it('keeps rows whose section/batch is unknown, or with no schedule', () => {
    expect(keep({ sectionId: 99, schedule: '2027-01-01 09:00:00' })).toBe(true)
    expect(keep({ sectionId: null, schedule: '2027-01-01 09:00:00' })).toBe(true)
    expect(keep({ sectionId: 5, schedule: null })).toBe(true)
  })
})
