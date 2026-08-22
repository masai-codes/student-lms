import { describe, expect, it, vi } from 'vitest'

import { reviveCancelledBatchUser } from '@/server/api/webhooks/admissions/steps/reviveCancelledBatchUser'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

type Captured = { set?: Record<string, unknown> }

/** Fake tx capturing the single `update().set().where()` the step issues. */
function tx(captured: Captured) {
  return {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        captured.set = values
        return { where: () => Promise.resolve() }
      },
    }),
  } as unknown as DbTransaction
}

async function revive(
  meta: string | null,
  history: Record<string, unknown> | null = null,
) {
  const captured: Captured = {}
  await reviveCancelledBatchUser(tx(captured), {
    batchUserId: 55,
    meta,
    history,
    payload: { enrolment_id: 123 },
  })
  return captured.set as Record<string, unknown>
}

describe('reviveCancelledBatchUser', () => {
  it('clears the soft-delete and puts the row back to active', async () => {
    const set = await revive(null)
    expect(set.deletedAt).toBe(null)
    expect(set.isActive).toBe(1)
    expect(set.status).toBe('active')
  })

  it('drops the cancel restriction keys while preserving other meta', async () => {
    const set = await revive(
      '{"batchEnrolmentCancelled":true,"batchEnrolmentCancelledDate":"2026-08-01","batchPaused":true,"isIitj":true}',
    )
    expect(JSON.parse(set.meta as string)).toEqual({
      batchPaused: true,
      isIitj: true,
    })
  })

  it('appends a revived timeline entry and the undo_cancel payload', async () => {
    const set = await revive(null, {
      timeline: [{ type: 'cancelled', date: '2026-08-01' }],
    })
    const history = set.history as {
      timeline: { type: string }[]
      admissionPayloadHistory: { type: string; payload: unknown }[]
    }
    expect(history.timeline.map((entry) => entry.type)).toEqual([
      'cancelled',
      'revived',
    ])
    expect(history.admissionPayloadHistory).toHaveLength(1)
    expect(history.admissionPayloadHistory[0]).toMatchObject({
      type: 'undo_cancel',
      payload: { enrolment_id: 123 },
    })
  })
})
