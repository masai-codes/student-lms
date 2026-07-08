import { describe, expect, it, vi } from 'vitest'

// The util transitively imports `@/db` (via batchBan); stub it for the pure logic.
vi.mock('@/db', () => ({ db: {} }))

import type { UserBatchBans } from '@/server/users/batchBan'
import { resolveLearnDetailBanRestriction } from '../resolveLearnDetailBanRestriction'

const CUTOFF = '2026-07-01 23:59:59'
const AFTER = '2026-07-02 09:00:00'
const BEFORE = '2026-07-01 09:00:00'

function bans(over: Partial<UserBatchBans> = {}): UserBatchBans {
  return {
    normalByBatch: new Map(),
    agreementByBatch: new Map(),
    ...over,
  }
}

describe('resolveLearnDetailBanRestriction', () => {
  it('returns null when the content has no resolvable batch', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: null,
        schedule: AFTER,
        bans: bans({ normalByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'recording',
      }),
    ).toBeNull()
  })

  it('blocks the whole page for a normal ban after the ban date', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: AFTER,
        bans: bans({ normalByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'recording',
      }),
    ).toEqual({ kind: 'page' })
  })

  it('does not block when the normal-banned item is on/before the ban date', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: BEFORE,
        bans: bans({ normalByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: null,
      }),
    ).toBeNull()
  })

  it('applies the agreement recording restriction after the agreement date', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: AFTER,
        bans: bans({ agreementByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'recording',
      }),
    ).toEqual({ kind: 'recording' })
  })

  it('applies the agreement practice restriction after the agreement date', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: AFTER,
        bans: bans({ agreementByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'practice',
      }),
    ).toEqual({ kind: 'practice' })
  })

  it('normal ban takes precedence over an agreement ban on the same batch', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: AFTER,
        bans: bans({
          normalByBatch: new Map([[10, CUTOFF]]),
          agreementByBatch: new Map([[10, CUTOFF]]),
        }),
        agreementRestrictionKind: 'recording',
      }),
    ).toEqual({ kind: 'page' })
  })

  it('never applies an agreement restriction when the kind is null (e.g. resources)', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: AFTER,
        bans: bans({ agreementByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: null,
      }),
    ).toBeNull()
  })

  it('applies the agreement restriction regardless of schedule date (not date-gated)', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: BEFORE,
        bans: bans({ agreementByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'recording',
      }),
    ).toEqual({ kind: 'recording' })
  })

  it('applies the agreement restriction even for content with no schedule', () => {
    expect(
      resolveLearnDetailBanRestriction({
        contentBatchId: 10,
        schedule: null,
        bans: bans({ agreementByBatch: new Map([[10, CUTOFF]]) }),
        agreementRestrictionKind: 'practice',
      }),
    ).toEqual({ kind: 'practice' })
  })
})
