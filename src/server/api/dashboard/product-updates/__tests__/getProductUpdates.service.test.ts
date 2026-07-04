import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  getCutoff: vi.fn(),
  limit: vi.fn(),
  offset: vi.fn(),
}))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    orderBy: () => chain,
    limit: (n: number) => {
      hoisted.limit(n)
      return chain
    },
    offset: (n: number) => {
      hoisted.offset(n)
      return Promise.resolve(hoisted.rows)
    },
  }
  return { db: chain }
})

vi.mock('@/server/users/getBannedContentCutoffForUser', () => ({
  getBannedContentCutoffForUser: hoisted.getCutoff,
}))

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: "What's new in the LMS",
  image: '/update.png',
  createdAt: '2026-07-01 10:00:00',
  ...over,
})

describe('getProductUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getCutoff.mockResolvedValue(null)
  })

  it('maps newest whatsnew rows to the DTO for everyone', async () => {
    hoisted.rows = [row(), row({ id: 2, image: null })]
    const { getProductUpdates } = await import('../getProductUpdates.service')

    const result = await getProductUpdates(42)
    expect(result).toEqual([
      { id: 1, title: "What's new in the LMS", imageUrl: '/update.png' },
      { id: 2, title: "What's new in the LMS", imageUrl: null },
    ])
  })

  it('defaults to a page size of 25 and offset 0', async () => {
    hoisted.rows = [row()]
    const { getProductUpdates } = await import('../getProductUpdates.service')

    await getProductUpdates(42)
    expect(hoisted.limit).toHaveBeenCalledWith(25)
    expect(hoisted.offset).toHaveBeenCalledWith(0)
  })

  it('forwards explicit limit/offset for pagination', async () => {
    hoisted.rows = []
    const { getProductUpdates } = await import('../getProductUpdates.service')

    await getProductUpdates(42, 25, 50)
    expect(hoisted.limit).toHaveBeenCalledWith(25)
    expect(hoisted.offset).toHaveBeenCalledWith(50)
  })

  it('hides updates created after a banned user cutoff', async () => {
    hoisted.getCutoff.mockResolvedValue(new Date('2026-06-15T00:00:00Z'))
    hoisted.rows = [
      row({ id: 1, createdAt: '2026-07-01 10:00:00' }),
      row({ id: 2, createdAt: '2026-06-01 10:00:00' }),
    ]
    const { getProductUpdates } = await import('../getProductUpdates.service')

    const result = await getProductUpdates(42)
    expect(result.map((r) => r.id)).toEqual([2])
  })
})
