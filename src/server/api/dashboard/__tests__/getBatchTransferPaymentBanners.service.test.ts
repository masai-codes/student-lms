import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getBatchTransferPaymentBanners } from '@/server/api/dashboard/getBatchTransferPaymentBanners.service'

const state = vi.hoisted(() => ({ rows: [] as unknown[] }))
const getBatchIdsForEnrolledUser = vi.hoisted(() => vi.fn())

// db.select().from().leftJoin().where() resolves to `state.rows`.
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        leftJoin: () => ({ where: () => Promise.resolve(state.rows) }),
      }),
    }),
  },
}))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser,
}))

function row(overrides: Record<string, unknown> = {}) {
  return {
    batchUserId: 55,
    sourceBatchId: 10,
    toBatchId: 22,
    enrolmentId: 2032,
    batchName: 'FinTech AI',
    batchMeta: null,
    ...overrides,
  }
}

beforeEach(() => {
  state.rows = []
  getBatchIdsForEnrolledUser.mockReset().mockResolvedValue([10])
  process.env.ADMISSIONS_SSO_BASE_URL = 'https://admissions.example.com'
  process.env.ADMISSIONS_SSO_SECRET = 'secret'
})

afterEach(() => {
  delete process.env.ADMISSIONS_SSO_BASE_URL
  delete process.env.ADMISSIONS_SSO_SECRET
})

describe('getBatchTransferPaymentBanners', () => {
  it('returns [] when no batch qualifies', async () => {
    state.rows = []
    await expect(getBatchTransferPaymentBanners(7)).resolves.toEqual([])
  })

  it('builds a CTA pointing at the click-time redirect route (token minted on click)', async () => {
    state.rows = [row()]
    const banners = await getBatchTransferPaymentBanners(7)
    expect(banners).toEqual([
      {
        batchUserId: 55,
        toBatchId: 22,
        courseTitle: 'FinTech AI',
        paymentUrl:
          '/api/admissions/enrolment-payment-redirect?enrolmentId=2032',
      },
    ])
  })

  it('hides the banner when the source enrolment is cancelled (not enrolled)', async () => {
    getBatchIdsForEnrolledUser.mockResolvedValue([999]) // source batch 10 excluded
    state.rows = [row()]
    await expect(getBatchTransferPaymentBanners(7)).resolves.toEqual([])
  })

  it('falls back to the target batch id when the course title is unknown', async () => {
    state.rows = [row({ batchName: null, batchMeta: null })]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.courseTitle).toBe('22')
  })

  it('disables the CTA (null url) when the SSO base url is not configured', async () => {
    delete process.env.ADMISSIONS_SSO_BASE_URL
    state.rows = [row()]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.paymentUrl).toBeNull()
  })

  it('disables the CTA (null url) when the SSO secret is not configured', async () => {
    delete process.env.ADMISSIONS_SSO_SECRET
    state.rows = [row()]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.paymentUrl).toBeNull()
  })
})
