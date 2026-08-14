import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findCurrentLmsBatch } from '@/server/api/user-auth/services/findCurrentLmsBatch.service'

const selectLimit = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({
              limit: (...args: unknown[]) => selectLimit(...args),
            }),
          }),
        }),
      }),
    }),
  },
}))

const BATCH = {
  id: 12,
  name: 'FT-WEB-27',
  starting: '2026-01-15',
  duration: '30 weeks',
  program: 'full_stack',
}

beforeEach(() => {
  selectLimit.mockReset()
})

describe('findCurrentLmsBatch', () => {
  it('returns the latest current batch row', async () => {
    selectLimit.mockResolvedValue([BATCH])
    await expect(findCurrentLmsBatch(7)).resolves.toEqual(BATCH)
    expect(selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when the user has no current batch', async () => {
    selectLimit.mockResolvedValue([])
    await expect(findCurrentLmsBatch(7)).resolves.toBeNull()
  })
})
