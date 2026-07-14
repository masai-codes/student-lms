import { describe, expect, it } from 'vitest'

import {
  getCancelledBatchIds,
  getPausedCutoff,
  makePausedScheduleFilter,
} from '@/server/restrictions/enrollmentRestrictionScope'
import type {
  BatchRestrictionFlags,
  UserBatchRestrictions,
} from '@/server/restrictions/types'

function flags(partial: Partial<BatchRestrictionFlags>): BatchRestrictionFlags {
  return {
    enrolmentCancelled: false,
    enrolmentCancelledDate: null,
    paused: false,
    pausedDate: null,
    agreementBanned: false,
    agreementBannedDate: null,
    ...partial,
  }
}

describe('getCancelledBatchIds', () => {
  it('collects only cancelled batches', () => {
    const r: UserBatchRestrictions = new Map([
      [1, flags({ enrolmentCancelled: true })],
      [2, flags({ paused: true, pausedDate: '2026-07-01' })],
      [3, flags({ agreementBanned: true })],
    ])
    expect([...getCancelledBatchIds(r)]).toEqual([1])
  })
})

describe('getPausedCutoff', () => {
  it('returns the normalized cutoff for a paused batch', () => {
    const r: UserBatchRestrictions = new Map([
      [2, flags({ paused: true, pausedDate: '2026-07-01' })],
    ])
    expect(getPausedCutoff(r, 2)).toBe('2026-07-01 23:59:59')
  })

  it('returns null for a non-paused / unknown batch', () => {
    const r: UserBatchRestrictions = new Map([
      [3, flags({ agreementBanned: true })],
    ])
    expect(getPausedCutoff(r, 3)).toBeNull()
    expect(getPausedCutoff(r, 99)).toBeNull()
  })
})

describe('makePausedScheduleFilter', () => {
  const restrictions: UserBatchRestrictions = new Map([
    [1, flags({ enrolmentCancelled: true })],
    [2, flags({ paused: true, pausedDate: '2026-07-01' })],
  ])
  const sectionToBatch = new Map<number, number>([
    [10, 1], // section in cancelled batch
    [20, 2], // section in paused batch
    [30, 3], // section in unrestricted batch
  ])
  const keep = makePausedScheduleFilter(restrictions, sectionToBatch)

  it('drops rows in a cancelled batch', () => {
    expect(keep({ sectionId: 10, schedule: '2026-06-01 00:00:00' })).toBe(false)
  })

  it('drops paused-batch rows scheduled after the cutoff, keeps earlier ones', () => {
    expect(keep({ sectionId: 20, schedule: '2026-07-10 00:00:00' })).toBe(false)
    expect(keep({ sectionId: 20, schedule: '2026-06-20 00:00:00' })).toBe(true)
  })

  it('keeps rows in unrestricted batches and rows with unknown sections', () => {
    expect(keep({ sectionId: 30, schedule: '2026-08-01 00:00:00' })).toBe(true)
    expect(keep({ sectionId: null, schedule: '2026-08-01 00:00:00' })).toBe(
      true,
    )
    expect(keep({ sectionId: 999, schedule: '2026-08-01 00:00:00' })).toBe(true)
  })
})
