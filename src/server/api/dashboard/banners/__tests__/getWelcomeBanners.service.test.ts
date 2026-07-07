import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  bannerRows: [] as Array<Record<string, unknown>>,
  getBatchIds: vi.fn(),
}))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => Promise.resolve(hoisted.bannerRows),
  }
  return { db: chain }
})

vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIds,
}))

// IST now = 2026-07-02 12:00:00 (06:30 UTC + 5:30)
const NOW = new Date('2026-07-02T06:30:00Z')

const bannerRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Refer a friend',
  description: 'Earn rewards',
  imageUrl: '/coin.png',
  ctaUrl: '/refer',
  type: 'promo',
  variant: 'v1',
  groupName: 'referral',
  visibleTo: { batches: [], random_group: [] },
  startDate: '2026-07-01 00:00:00',
  endDate: '2026-07-10 00:00:00',
  createdAt: '2026-06-01 00:00:00',
  ...over,
})

describe('getWelcomeBanners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getBatchIds.mockResolvedValue([5])
  })

  it('returns in-window banners mapped to the DTO', async () => {
    hoisted.bannerRows = [bannerRow()]
    const { getWelcomeBanners } = await import('../getWelcomeBanners.service')

    const result = await getWelcomeBanners(42, NOW)

    expect(result).toEqual([
      {
        id: 1,
        title: 'Refer a friend',
        description: 'Earn rewards',
        imageUrl: '/coin.png',
        ctaUrl: '/refer',
        analyticsKey: 'referral',
      },
    ])
  })

  it('drops banners outside the IST time window', async () => {
    hoisted.bannerRows = [bannerRow({ startDate: '2026-07-05 00:00:00' })]
    const { getWelcomeBanners } = await import('../getWelcomeBanners.service')

    expect(await getWelcomeBanners(42, NOW)).toEqual([])
  })

  it('keeps only batch-targeted banners the user belongs to', async () => {
    hoisted.getBatchIds.mockResolvedValue([9])
    hoisted.bannerRows = [
      bannerRow({ id: 1, visibleTo: { batches: [9] } }),
      bannerRow({ id: 2, visibleTo: { batches: [5] } }),
    ]
    const { getWelcomeBanners } = await import('../getWelcomeBanners.service')

    const result = await getWelcomeBanners(42, NOW)
    expect(result.map((b) => b.id)).toEqual([1])
  })
})
