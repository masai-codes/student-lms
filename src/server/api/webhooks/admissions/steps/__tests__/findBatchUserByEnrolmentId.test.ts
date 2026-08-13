import { describe, expect, it, vi } from 'vitest'

import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

function row(id: number) {
  return { id, userId: 7, batchId: 10, meta: null, history: null }
}

type Captured = { where?: unknown }

/**
 * Fake tx whose select().from().innerJoin().where().orderBy() resolves to `rows`
 * (already ordered newest-first, mirroring the desc(createdAt) ordering). The
 * client filter itself is a SQL predicate, so the rows a caller passes in stand
 * for "what the DB returned for this where clause"; `captured.where` only proves
 * a condition was built.
 */
function tx(rows: ReturnType<typeof row>[], captured: Captured = {}) {
  return {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: (condition: unknown) => {
            captured.where = condition
            return { orderBy: () => Promise.resolve(rows) }
          },
        }),
      }),
    }),
  } as unknown as DbTransaction
}

describe('findBatchUserByEnrolmentId', () => {
  it('returns the single row when only one matches', async () => {
    const result = await findBatchUserByEnrolmentId(tx([row(1)]), {
      enrolmentId: 999,
    })
    expect(result.id).toBe(1)
  })

  it('picks the latest-created row when several match and no lms_batch_user_id', async () => {
    // rows arrive newest-first, so the first is the latest created.
    const result = await findBatchUserByEnrolmentId(
      tx([row(3), row(2), row(1)]),
      {
        enrolmentId: 999,
      },
    )
    expect(result.id).toBe(3)
  })

  it('picks the row matching lms_batch_user_id when several match', async () => {
    const result = await findBatchUserByEnrolmentId(
      tx([row(3), row(2), row(1)]),
      {
        enrolmentId: 999,
        lmsBatchUserId: 2,
      },
    )
    expect(result.id).toBe(2)
  })

  it('falls back to the latest when lms_batch_user_id matches nothing', async () => {
    const result = await findBatchUserByEnrolmentId(tx([row(3), row(2)]), {
      enrolmentId: 999,
      lmsBatchUserId: 99,
    })
    expect(result.id).toBe(3)
  })

  it('throws ENROLMENT_NOT_FOUND when no row matches', async () => {
    await expect(
      findBatchUserByEnrolmentId(tx([]), { enrolmentId: 999 }),
    ).rejects.toMatchObject({ code: 'ENROLMENT_NOT_FOUND' })
  })

  it('throws ENROLMENT_NOT_FOUND when the client filter excludes every row', async () => {
    // The client predicate is applied in SQL, so a mismatch surfaces as no rows.
    await expect(
      findBatchUserByEnrolmentId(tx([]), { enrolmentId: 999, client: 'iitj' }),
    ).rejects.toMatchObject({ code: 'ENROLMENT_NOT_FOUND' })
  })

  it('builds a wider where clause when a client is given', async () => {
    const withClient: Captured = {}
    const withoutClient: Captured = {}
    await findBatchUserByEnrolmentId(tx([row(1)], withClient), {
      enrolmentId: 999,
      client: 'ihub',
    })
    await findBatchUserByEnrolmentId(tx([row(1)], withoutClient), {
      enrolmentId: 999,
    })

    // and(a, undefined) collapses to just `a`; and(a, b) keeps both, so the
    // client variant carries strictly more SQL chunks.
    const chunks = (condition: unknown) =>
      (condition as { queryChunks: unknown[] }).queryChunks.length
    expect(chunks(withClient.where)).toBeGreaterThan(
      chunks(withoutClient.where),
    )
  })
})
