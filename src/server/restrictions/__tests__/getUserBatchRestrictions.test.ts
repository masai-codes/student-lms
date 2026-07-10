import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<{ batchId: number; meta: string | null }>,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(hoisted.rows),
      }),
    }),
  },
}))

import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'

describe('getUserBatchRestrictions', () => {
  beforeEach(() => {
    hoisted.rows = []
  })

  it('parses each restriction flag + date from batch_user.meta', async () => {
    hoisted.rows = [
      {
        batchId: 1,
        meta: JSON.stringify({
          batchEnrolmentCancelled: true,
          batchEnrolmentCancelledDate: '2026-07-01',
        }),
      },
      {
        batchId: 2,
        meta: JSON.stringify({ batchPaused: true, batchPausedDate: '2026-07-02' }),
      },
      {
        batchId: 3,
        meta: JSON.stringify({ aggrementBanned: true, aggrementBannedDate: '2026-07-03' }),
      },
    ]

    const r = await getUserBatchRestrictions(0)

    expect(r.get(1)).toMatchObject({
      enrolmentCancelled: true,
      enrolmentCancelledDate: '2026-07-01',
    })
    expect(r.get(2)).toMatchObject({ paused: true, pausedDate: '2026-07-02' })
    expect(r.get(3)).toMatchObject({
      agreementBanned: true,
      agreementBannedDate: '2026-07-03',
    })
  })

  it('omits batches with no flags, and rows with empty/invalid meta', async () => {
    hoisted.rows = [
      { batchId: 1, meta: null },
      { batchId: 2, meta: 'not json' },
      { batchId: 3, meta: JSON.stringify({ someOtherKey: true }) },
      { batchId: 4, meta: JSON.stringify({ batchPaused: false }) },
    ]

    const r = await getUserBatchRestrictions(0)
    expect(r.size).toBe(0)
  })

  it('merges flags across multiple batch_user rows for the same batch', async () => {
    hoisted.rows = [
      { batchId: 5, meta: JSON.stringify({ batchPaused: true, batchPausedDate: '2026-07-02' }) },
      { batchId: 5, meta: JSON.stringify({ aggrementBanned: true }) },
    ]

    const r = await getUserBatchRestrictions(0)
    expect(r.get(5)).toMatchObject({
      paused: true,
      pausedDate: '2026-07-02',
      agreementBanned: true,
    })
  })
})
