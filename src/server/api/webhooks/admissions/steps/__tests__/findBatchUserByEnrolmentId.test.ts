import { describe, expect, it, vi } from 'vitest'

import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

function row(id: number) {
  return { id, userId: 7, batchId: 10, meta: null, history: null }
}

// Fake tx whose select().from().where().orderBy() resolves to `rows`
// (already ordered newest-first, mirroring the desc(createdAt) ordering).
function tx(rows: ReturnType<typeof row>[]): DbTransaction {
  return {
    select: () => ({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve(rows) }) }),
    }),
  } as unknown as DbTransaction
}

describe('findBatchUserByEnrolmentId', () => {
  it('returns the single row when only one matches', async () => {
    const result = await findBatchUserByEnrolmentId(tx([row(1)]), 999)
    expect(result.id).toBe(1)
  })

  it('picks the latest-created row when several match and no lms_batch_user_id', async () => {
    // rows arrive newest-first, so the first is the latest created.
    const result = await findBatchUserByEnrolmentId(
      tx([row(3), row(2), row(1)]),
      999,
    )
    expect(result.id).toBe(3)
  })

  it('picks the row matching lms_batch_user_id when several match', async () => {
    const result = await findBatchUserByEnrolmentId(
      tx([row(3), row(2), row(1)]),
      999,
      2,
    )
    expect(result.id).toBe(2)
  })

  it('falls back to the latest when lms_batch_user_id matches nothing', async () => {
    const result = await findBatchUserByEnrolmentId(
      tx([row(3), row(2)]),
      999,
      99,
    )
    expect(result.id).toBe(3)
  })

  it('throws ENROLMENT_NOT_FOUND when no row matches', async () => {
    await expect(findBatchUserByEnrolmentId(tx([]), 999)).rejects.toMatchObject(
      { code: 'ENROLMENT_NOT_FOUND' },
    )
  })
})
