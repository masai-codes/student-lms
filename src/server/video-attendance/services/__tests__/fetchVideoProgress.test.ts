import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchVideoProgress } from '../fetchVideoProgress'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

function mockRow(row: unknown) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(row ? [row] : []) }),
    }),
  })
}

describe('fetchVideoProgress (native)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for an invalid lecture id', async () => {
    await expect(fetchVideoProgress(0, 7)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null for an invalid user id', async () => {
    await expect(fetchVideoProgress(12, 0)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns a zeroed payload when no row exists', async () => {
    mockRow(null)
    await expect(fetchVideoProgress(12, 7)).resolves.toEqual({
      lectureId: 12,
      lastWatchedPosition: 0,
      totalDuration: null,
      watchPercentage: 0,
    })
  })

  it('derives lastWatchedPosition from the max interval end', async () => {
    mockRow({
      intervals: [
        { start: 0, end: 30 },
        { start: 30, end: 42 },
      ],
      totalDuration: 100,
      duration: 40,
    })

    await expect(fetchVideoProgress(12, 7)).resolves.toEqual({
      lectureId: 12,
      lastWatchedPosition: 42,
      totalDuration: 100,
      watchPercentage: 40,
    })
  })
})
