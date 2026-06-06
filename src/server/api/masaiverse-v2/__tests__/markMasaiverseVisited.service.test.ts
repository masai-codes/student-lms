import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  users: { id: 'users.id', meta: 'users.meta' },
}))

function mockSelectResult(rows: Array<{ meta: unknown }>) {
  return {
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(rows) }),
    }),
  }
}

function captureUpdate() {
  const setArgs: Array<unknown> = []
  hoisted.dbUpdate.mockReturnValueOnce({
    set: (value: unknown) => {
      setArgs.push(value)
      return { where: () => Promise.resolve(undefined) }
    },
  })
  return setArgs
}

describe('markMasaiverseVisited service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the flag while preserving existing meta keys', async () => {
    const { markMasaiverseVisited } = await import(
      '../markMasaiverseVisited.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      mockSelectResult([{ meta: { profile_pic: 'p.png' } }]),
    )
    const setArgs = captureUpdate()

    await markMasaiverseVisited(42)

    expect(setArgs[0]).toEqual({
      meta: { profile_pic: 'p.png', isMasaiverseVisitedOnce: true },
    })
  })

  it('initializes meta when the column is null', async () => {
    const { markMasaiverseVisited } = await import(
      '../markMasaiverseVisited.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(mockSelectResult([{ meta: null }]))
    const setArgs = captureUpdate()

    await markMasaiverseVisited(1)

    expect(setArgs[0]).toEqual({ meta: { isMasaiverseVisitedOnce: true } })
  })

  it('is a no-op when the flag is already set', async () => {
    const { markMasaiverseVisited } = await import(
      '../markMasaiverseVisited.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      mockSelectResult([{ meta: { isMasaiverseVisitedOnce: true } }]),
    )

    await markMasaiverseVisited(9)

    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('is a no-op when the user does not exist', async () => {
    const { markMasaiverseVisited } = await import(
      '../markMasaiverseVisited.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(mockSelectResult([]))

    await markMasaiverseVisited(404)

    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })
})
