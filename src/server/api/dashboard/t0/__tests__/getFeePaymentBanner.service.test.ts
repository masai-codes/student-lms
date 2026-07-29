import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getFeePaymentBanners } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'

const state = vi.hoisted(() => ({ rows: [] as unknown[] }))
const getBatchIdsForEnrolledUser = vi.hoisted(() => vi.fn())
const computeFeePaymentBanner = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({ db: { execute: () => Promise.resolve(state.rows) } }))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser,
}))
vi.mock('@/server/api/dashboard/t0/feePaymentBanner', () => ({
  computeFeePaymentBanner,
}))

function feeRow(batchId: number, overrides: Record<string, unknown> = {}) {
  return {
    batch_id: batchId,
    full_fees_paid: 0,
    course_fee_deadline: '2026-08-01 00:00:00',
    payment_url: null,
    batch_name: `Course ${batchId}`,
    batch_meta: null,
    ...overrides,
  }
}

beforeEach(() => {
  state.rows = []
  getBatchIdsForEnrolledUser.mockReset().mockResolvedValue([10, 20])
  computeFeePaymentBanner.mockReset().mockReturnValue({
    type: 'timer',
    daysRemaining: 3,
    hoursRemaining: null,
    paymentUrl: null,
  })
})

describe('getFeePaymentBanners', () => {
  it('returns [] when the user has no active enrolments', async () => {
    getBatchIdsForEnrolledUser.mockResolvedValue([])
    state.rows = [feeRow(10)]
    await expect(getFeePaymentBanners(7)).resolves.toEqual([])
  })

  it('excludes payment banners for cancelled / non-enrolled batches', async () => {
    // batch 10 is enrolled; batch 99 is not (e.g. cancelled) — it must not show.
    getBatchIdsForEnrolledUser.mockResolvedValue([10])
    state.rows = [feeRow(10), feeRow(99)]
    const banners = await getFeePaymentBanners(7)
    expect(banners.map((b) => b.batchId)).toEqual([10])
  })

  it('skips fully-paid batches', async () => {
    state.rows = [feeRow(10, { full_fees_paid: 1 })]
    await expect(getFeePaymentBanners(7)).resolves.toEqual([])
  })
})
