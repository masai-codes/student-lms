import { describe, expect, it } from 'vitest'

import { resolveLearnDetailRestriction } from '@/server/restrictions/resolveLearnDetailRestriction'
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

function restrictions(
  batchId: number,
  partial: Partial<BatchRestrictionFlags>,
): UserBatchRestrictions {
  return new Map([[batchId, flags(partial)]])
}

describe('resolveLearnDetailRestriction', () => {
  it('returns null when the batch has no restriction', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 1,
        schedule: '2026-07-10 10:00:00',
        restrictions: new Map(),
        agreementScope: 'recording',
      }),
    ).toBeNull()
  })

  it('returns null when contentBatchId is null', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: null,
        schedule: null,
        restrictions: restrictions(1, { enrolmentCancelled: true }),
        agreementScope: 'recording',
      }),
    ).toBeNull()
  })

  it('cancelled wins over everything', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 1,
        schedule: '2026-07-10 10:00:00',
        restrictions: restrictions(1, {
          enrolmentCancelled: true,
          paused: true,
          pausedDate: '2026-07-01',
          agreementBanned: true,
        }),
        agreementScope: 'recording',
      }),
    ).toEqual({ kind: 'enrolment-cancelled' })
  })

  it('paused blocks content scheduled after the pause date', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 1,
        schedule: '2026-07-10 10:00:00',
        restrictions: restrictions(1, {
          paused: true,
          pausedDate: '2026-07-01',
        }),
        agreementScope: null,
      }),
    ).toEqual({ kind: 'paused' })
  })

  it('paused allows content scheduled before the pause date', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 1,
        schedule: '2026-06-20 10:00:00',
        restrictions: restrictions(1, {
          paused: true,
          pausedDate: '2026-07-01',
        }),
        agreementScope: null,
      }),
    ).toBeNull()
  })

  it('agreement ban restricts recordings and practice per scope', () => {
    const r = restrictions(9, { agreementBanned: true })
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 9,
        schedule: null,
        restrictions: r,
        agreementScope: 'recording',
      }),
    ).toEqual({ kind: 'agreement-recording', batchId: 9 })
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 9,
        schedule: null,
        restrictions: r,
        agreementScope: 'practice',
      }),
    ).toEqual({ kind: 'agreement-practice', batchId: 9 })
  })

  it('agreement ban does not restrict when scope is null (resources, live, non-practice)', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 9,
        schedule: null,
        restrictions: restrictions(9, { agreementBanned: true }),
        agreementScope: null,
      }),
    ).toBeNull()
  })

  it('paused-before-cutoff still allows an agreement recording block', () => {
    expect(
      resolveLearnDetailRestriction({
        contentBatchId: 9,
        schedule: '2026-06-20 10:00:00',
        restrictions: restrictions(9, {
          paused: true,
          pausedDate: '2026-07-01',
          agreementBanned: true,
        }),
        agreementScope: 'recording',
      }),
    ).toEqual({ kind: 'agreement-recording', batchId: 9 })
  })
})
