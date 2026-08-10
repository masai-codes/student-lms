import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<{
    batchId: number
    meta: string | null
    deletedAt?: string | null
  }>,
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
        meta: JSON.stringify({
          batchPaused: true,
          batchPausedDate: '2026-07-02',
        }),
      },
      {
        batchId: 3,
        meta: JSON.stringify({
          aggrementBanned: true,
          aggrementBannedDate: '2026-07-03',
        }),
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

  it('reads keys from the legacy array-of-objects meta shape', async () => {
    hoisted.rows = [
      {
        batchId: 7,
        // Real-world shape: an array whose object also carries the restriction keys.
        meta: JSON.stringify([
          {
            Student: '2022-07-25 00:00:00',
            batchPaused: true,
            batchPausedDate: '2026-07-02',
          },
        ]),
      },
      {
        batchId: 8,
        // Keys added as a separate object in the array.
        meta: JSON.stringify([
          { Student: '2022-07-25 00:00:00' },
          { aggrementBanned: true, aggrementBannedDate: '2026-07-03' },
        ]),
      },
    ]

    const r = await getUserBatchRestrictions(0)
    expect(r.get(7)).toMatchObject({ paused: true, pausedDate: '2026-07-02' })
    expect(r.get(8)).toMatchObject({
      agreementBanned: true,
      agreementBannedDate: '2026-07-03',
    })
  })

  it('keeps the restriction from a soft-deleted (cancelled) batch_user row', async () => {
    // Cancelling an enrolment writes the flag AND soft-deletes the row, so
    // skipping deleted rows would drop the only record of the cancellation.
    hoisted.rows = [
      {
        batchId: 9,
        deletedAt: '2026-07-25 13:38:19',
        meta: JSON.stringify({
          batchEnrolmentCancelled: true,
          batchEnrolmentCancelledDate: '2026-07-25T13:38:18.991Z',
        }),
      },
    ]

    const r = await getUserBatchRestrictions(0)
    expect(r.get(9)).toMatchObject({ enrolmentCancelled: true })
  })

  it('ignores a soft-deleted row when the batch has a live row', async () => {
    // Re-enrolled into the same batch: the old cancellation must not restrict it.
    hoisted.rows = [
      {
        batchId: 10,
        deletedAt: '2026-07-25 13:38:19',
        meta: JSON.stringify({ batchEnrolmentCancelled: true }),
      },
      { batchId: 10, deletedAt: null, meta: JSON.stringify({ isIhub: false }) },
    ]

    const r = await getUserBatchRestrictions(0)
    expect(r.has(10)).toBe(false)
  })

  it('merges flags across multiple batch_user rows for the same batch', async () => {
    hoisted.rows = [
      {
        batchId: 5,
        meta: JSON.stringify({
          batchPaused: true,
          batchPausedDate: '2026-07-02',
        }),
      },
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
