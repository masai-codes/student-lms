import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<{ id: number }> }))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('ensureUserCanAccessLearnHubEntity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grants access when the user is a member of the section', async () => {
    hoisted.rows = [{ id: 1 }]
    const { ensureUserCanAccessLearnHubEntity } = await import(
      '../ensureLearnEntityAccess'
    )

    expect(await ensureUserCanAccessLearnHubEntity(42, 7)).toBe(true)
  })

  it('denies access when the user is not a member of the section', async () => {
    hoisted.rows = []
    const { ensureUserCanAccessLearnHubEntity } = await import(
      '../ensureLearnEntityAccess'
    )

    expect(await ensureUserCanAccessLearnHubEntity(42, 7)).toBe(false)
  })

  it('denies access when the entity has no section (cannot verify membership)', async () => {
    // A batch-enrolled user must NOT be able to open a section-less row; batch
    // membership is deliberately never consulted here.
    hoisted.rows = [{ id: 1 }]
    const { ensureUserCanAccessLearnHubEntity } = await import(
      '../ensureLearnEntityAccess'
    )

    expect(await ensureUserCanAccessLearnHubEntity(42, null)).toBe(false)
  })
})
