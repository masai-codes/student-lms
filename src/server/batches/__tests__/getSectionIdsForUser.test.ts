import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<{ sectionId: number }> }))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    innerJoin: () => chain,
    where: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('getSectionIdsForUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the distinct section ids for the user', async () => {
    hoisted.rows = [{ sectionId: 5 }, { sectionId: 9 }, { sectionId: 5 }]
    const { getSectionIdsForUser } = await import('../getSectionIdsForUser')

    expect(await getSectionIdsForUser(42)).toEqual([5, 9])
  })

  it('returns an empty array when the user has no sections', async () => {
    hoisted.rows = []
    const { getSectionIdsForUser } = await import('../getSectionIdsForUser')

    expect(await getSectionIdsForUser(42)).toEqual([])
  })
})
