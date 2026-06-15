import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  masaiverseBanners: {
    id: 'masaiverse_banners.id',
    title: 'masaiverse_banners.title',
    description: 'masaiverse_banners.description',
    ctaText: 'masaiverse_banners.cta_text',
    ctaUrl: 'masaiverse_banners.cta_url',
    meta: 'masaiverse_banners.meta',
    createdAt: 'masaiverse_banners.created_at',
  },
  clubs: { meta: 'clubs.meta' },
  events: { meta: 'events.meta' },
}))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: vi.fn(),
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ orderBy: () => Promise.resolve(rows) }) }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMasaiverseBanners', () => {
  it('maps rows to the banner shape and reads isPublished from meta', async () => {
    const { getMasaiverseBanners } = await import('../services/getBanners.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 1,
          title: 'Welcome',
          description: 'Hello',
          ctaText: 'Go',
          ctaUrl: 'https://x',
          meta: { isPublished: true },
        },
        {
          id: 2,
          title: 'Draft one',
          description: null,
          ctaText: '  ',
          ctaUrl: null,
          meta: { isPublished: false },
        },
        { id: 3, title: 'No meta', description: null, ctaText: null, ctaUrl: null, meta: null },
      ]),
    )

    await expect(getMasaiverseBanners(true)).resolves.toEqual([
      {
        id: '1',
        title: 'Welcome',
        description: 'Hello',
        ctaText: 'Go',
        ctaUrl: 'https://x',
        isPublished: true,
      },
      {
        id: '2',
        title: 'Draft one',
        description: null,
        ctaText: null,
        ctaUrl: null,
        isPublished: false,
      },
      {
        id: '3',
        title: 'No meta',
        description: null,
        ctaText: null,
        ctaUrl: null,
        isPublished: false,
      },
    ])
  })

  it('returns an empty list when there are no banners', async () => {
    const { getMasaiverseBanners } = await import('../services/getBanners.service')
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getMasaiverseBanners(false)).resolves.toEqual([])
  })
})
