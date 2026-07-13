import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertViewerOwnsDiscussion } from '../assertViewerOwnsDiscussion'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<unknown> }))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.rows),
        }),
      }),
    }),
  },
}))

describe('assertViewerOwnsDiscussion', () => {
  beforeEach(() => {
    hoisted.rows = []
  })

  it('throws when the discussion does not exist', async () => {
    hoisted.rows = []
    await expect(assertViewerOwnsDiscussion(1, 10)).rejects.toThrow(
      'DISCUSSION_NOT_FOUND',
    )
  })

  it('throws when the viewer is not the author', async () => {
    hoisted.rows = [{ id: 10, userId: 2, isClosed: 0, data: null }]
    await expect(assertViewerOwnsDiscussion(1, 10)).rejects.toThrow(
      'DISCUSSION_FORBIDDEN',
    )
  })

  it('returns a normalized row for the owner', async () => {
    hoisted.rows = [{ id: 10, userId: 1, isClosed: 1, data: { learnFeedback: { rating: 2 } } }]
    await expect(assertViewerOwnsDiscussion(1, 10)).resolves.toEqual({
      id: 10,
      userId: 1,
      isClosed: 1,
      data: { learnFeedback: { rating: 2 } },
    })
  })

  it('coerces a missing data column to null', async () => {
    hoisted.rows = [{ id: 10, userId: 1, isClosed: 0, data: null }]
    const row = await assertViewerOwnsDiscussion(1, 10)
    expect(row.data).toBeNull()
    expect(row.isClosed).toBe(0)
  })
})
