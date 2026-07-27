import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getBatchTransferPaymentBanners } from '@/server/api/dashboard/getBatchTransferPaymentBanners.service'

const state = vi.hoisted(() => ({ rows: [] as unknown[] }))
const getAdmissionsSsoTokenForUser = vi.hoisted(() => vi.fn())

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
vi.mock('@/server/admissions/getAdmissionsSsoTokenForUser', () => ({
  getAdmissionsSsoTokenForUser,
}))

function row(overrides: Record<string, unknown> = {}) {
  return {
    batchUserId: 55,
    toBatchId: 22,
    enrolmentId: 2032,
    batchName: 'FinTech AI',
    batchMeta: null,
    ...overrides,
  }
}

beforeEach(() => {
  state.rows = []
  getAdmissionsSsoTokenForUser.mockReset()
  getAdmissionsSsoTokenForUser.mockResolvedValue('jwt-token')
  process.env.ADMISSIONS_SSO_BASE_URL = 'https://admissions.example.com'
})

afterEach(() => {
  delete process.env.ADMISSIONS_SSO_BASE_URL
})

describe('getBatchTransferPaymentBanners', () => {
  it('returns [] when no batch qualifies', async () => {
    state.rows = []
    await expect(getBatchTransferPaymentBanners(7)).resolves.toEqual([])
    // No token minted when there is nothing to show.
    expect(getAdmissionsSsoTokenForUser).not.toHaveBeenCalled()
  })

  it('builds a banner with a token + enrolment_id CTA url', async () => {
    state.rows = [row()]
    const banners = await getBatchTransferPaymentBanners(7)
    expect(banners).toEqual([
      {
        batchUserId: 55,
        toBatchId: 22,
        courseTitle: 'FinTech AI',
        paymentUrl:
          'https://admissions.example.com/lms-login?token=jwt-token&enrolment_id=2032',
      },
    ])
  })

  it('falls back to the target batch id when the course title is unknown', async () => {
    state.rows = [row({ batchName: null, batchMeta: null })]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.courseTitle).toBe('22')
  })

  it('disables the CTA (null url) when SSO is not configured', async () => {
    delete process.env.ADMISSIONS_SSO_BASE_URL
    state.rows = [row()]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.paymentUrl).toBeNull()
    expect(getAdmissionsSsoTokenForUser).not.toHaveBeenCalled()
  })

  it('disables the CTA when the token cannot be minted', async () => {
    getAdmissionsSsoTokenForUser.mockResolvedValue(null)
    state.rows = [row()]
    const [banner] = await getBatchTransferPaymentBanners(7)
    expect(banner.paymentUrl).toBeNull()
  })
})
