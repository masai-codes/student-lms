import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbExecute: vi.fn() }))

vi.mock('@/db', () => ({ db: { execute: hoisted.dbExecute } }))

describe('getCallbackEligibility', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is not a new-user-journey when there is no admission data', async () => {
    hoisted.dbExecute.mockResolvedValue([])
    const { getCallbackEligibility } = await import('../callback.service')

    expect(await getCallbackEligibility({ userId: 1, batchId: 10 })).toEqual({
      isNewUserJourney: false,
      hasFullFees: false,
    })
  })

  it('flags the new-user-journey and full fees for the active batch', async () => {
    hoisted.dbExecute.mockResolvedValue([
      { batch_id: 10, full_fees_paid: 1 },
      { batch_id: 11, full_fees_paid: 0 },
    ])
    const { getCallbackEligibility } = await import('../callback.service')

    expect(await getCallbackEligibility({ userId: 1, batchId: 10 })).toEqual({
      isNewUserJourney: true,
      hasFullFees: true,
    })
  })

  it('is a new-user-journey but without full fees when the active batch is unpaid', async () => {
    hoisted.dbExecute.mockResolvedValue([{ batch_id: 11, full_fees_paid: 1 }])
    const { getCallbackEligibility } = await import('../callback.service')

    expect(await getCallbackEligibility({ userId: 1, batchId: 10 })).toEqual({
      isNewUserJourney: true,
      hasFullFees: false,
    })
  })

  it('reads rows from a driver result that wraps them in `.rows`', async () => {
    hoisted.dbExecute.mockResolvedValue({
      rows: [{ batch_id: 10, full_fees_paid: 1 }],
    })
    const { getCallbackEligibility } = await import('../callback.service')

    expect(await getCallbackEligibility({ userId: 1, batchId: 10 })).toEqual({
      isNewUserJourney: true,
      hasFullFees: true,
    })
  })
})
