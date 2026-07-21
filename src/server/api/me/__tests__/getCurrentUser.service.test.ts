import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the signed-in user name', async () => {
    hoisted.rows = [{ name: 'Suryakumar' }]
    const { getCurrentUser } = await import('../getCurrentUser.service')
    expect(await getCurrentUser(42)).toEqual({ name: 'Suryakumar' })
  })

  it('returns null when the user row is missing', async () => {
    hoisted.rows = []
    const { getCurrentUser } = await import('../getCurrentUser.service')
    expect(await getCurrentUser(42)).toBeNull()
  })
})
