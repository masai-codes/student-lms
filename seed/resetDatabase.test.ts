import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}))

import { db } from '@/db'

import { resetDatabase } from './resetDatabase'

describe('resetDatabase', () => {
  it('throws in production', async () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    await expect(resetDatabase()).rejects.toThrow(/disabled in production/)
    process.env.NODE_ENV = previous
  })

  it('truncates tables excluding preserved migrations table', async () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    vi.mocked(db.execute)
      .mockResolvedValueOnce([
        [{ TABLE_NAME: '_prisma_migrations' }, { TABLE_NAME: 'users' }],
      ] as never)
      .mockResolvedValue(undefined as never)

    const result = await resetDatabase()

    expect(result.truncatedTables).toEqual(['users'])
    expect(db.execute).toHaveBeenCalled()

    process.env.NODE_ENV = previous
  })
})
