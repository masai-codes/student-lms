import { describe, expect, it, vi } from 'vitest'

import { reviveCancelledSectionUsers } from '@/server/api/webhooks/admissions/steps/reviveCancelledSectionUsers'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

type Row = { id: number; meta: unknown }
type Updated = { id: number; values: Record<string, unknown> }

/**
 * Fake tx: the select resolves to `rows` (standing for the soft-deleted
 * section_users the SQL returned), and every update() is recorded.
 */
function tx(rows: Row[], updates: Updated[]) {
  let pendingValues: Record<string, unknown> = {}
  return {
    select: () => ({
      from: () => ({
        innerJoin: () => ({ where: () => Promise.resolve(rows) }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        pendingValues = values
        return {
          where: (condition: { queryChunks?: unknown[] }) => {
            // The id is not readable off the drizzle condition, so record the
            // order instead — one update per revived row, in row order.
            void condition
            updates.push({
              id: rows[updates.length]?.id ?? -1,
              values: pendingValues,
            })
            return Promise.resolve()
          },
        }
      },
    }),
  } as unknown as DbTransaction
}

const cancelled = (id: number): Row => ({
  id,
  meta: {
    history: [
      { type: 'created', date: '2026-07-01' },
      { type: 'cancelled', date: '2026-08-01' },
    ],
  },
})

describe('reviveCancelledSectionUsers', () => {
  it('revives rows whose last history entry is a cancel', async () => {
    const updates: Updated[] = []
    const revived = await reviveCancelledSectionUsers(
      tx([cancelled(1), cancelled(2)], updates),
      { userId: 7, batchId: 10 },
    )

    expect(revived).toEqual([1, 2])
    expect(updates).toHaveLength(2)
    expect(updates[0].values.deletedAt).toBe(null)
    const meta = updates[0].values.meta as { history: { type: string }[] }
    expect(meta.history.map((entry) => entry.type)).toEqual([
      'created',
      'cancelled',
      'revived',
    ])
  })

  it('leaves rows deleted for other reasons alone', async () => {
    const updates: Updated[] = []
    const revived = await reviveCancelledSectionUsers(
      tx(
        [
          {
            id: 1,
            meta: { history: [{ type: 'created', date: '2026-07-01' }] },
          },
          { id: 2, meta: null },
          { id: 3, meta: { history: [] } },
          { id: 4, meta: 'not-json-object' },
        ],
        updates,
      ),
      { userId: 7, batchId: 10 },
    )

    expect(revived).toEqual([])
    expect(updates).toHaveLength(0)
  })

  it('returns an empty list when nothing in the batch is deleted', async () => {
    const revived = await reviveCancelledSectionUsers(tx([], []), {
      userId: 7,
      batchId: 10,
    })
    expect(revived).toEqual([])
  })
})
