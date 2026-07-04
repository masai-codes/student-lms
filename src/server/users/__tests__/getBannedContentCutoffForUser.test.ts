import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('getBannedContentCutoffForUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null for a non-banned user', async () => {
    hoisted.rows = [{ status: 'active', statusTime: '2026-01-01T00:00:00Z' }]
    const { getBannedContentCutoffForUser } = await import('../getBannedContentCutoffForUser')

    expect(await getBannedContentCutoffForUser(1)).toBeNull()
  })

  it('returns the cutoff date for a banned user', async () => {
    hoisted.rows = [{ status: 'banned', statusTime: '2026-05-01T00:00:00Z' }]
    const { getBannedContentCutoffForUser } = await import('../getBannedContentCutoffForUser')

    const cutoff = await getBannedContentCutoffForUser(1)
    expect(cutoff?.toISOString()).toBe('2026-05-01T00:00:00.000Z')
  })

  it('returns null when the user row is missing', async () => {
    hoisted.rows = []
    const { getBannedContentCutoffForUser } = await import('../getBannedContentCutoffForUser')

    expect(await getBannedContentCutoffForUser(1)).toBeNull()
  })
})
