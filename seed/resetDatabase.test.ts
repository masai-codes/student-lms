import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}))

import { db } from '@/db'

import { resetDatabase } from './resetDatabase'

describe('resetDatabase', () => {
  it('allows a localhost database even when NODE_ENV is production', async () => {
    const previous = process.env.NODE_ENV
    const previousDatabaseUrl = process.env.DATABASE_URL
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL =
      'mysql://root:root@localhost:3306/student_lms_test'

    vi.mocked(db.execute)
      .mockResolvedValueOnce([[{ TABLE_NAME: 'users' }]] as never)
      .mockResolvedValue(undefined as never)

    await expect(resetDatabase()).resolves.toEqual({
      truncatedTables: ['users'],
    })

    process.env.NODE_ENV = previous
    process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('throws when DATABASE_URL is not localhost', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'mysql://root:root@db.example.com:3306/prod'
    await expect(resetDatabase()).rejects.toThrow(/only when DATABASE_URL/)
    process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('truncates tables excluding preserved migrations table', async () => {
    const previous = process.env.NODE_ENV
    const previousDatabaseUrl = process.env.DATABASE_URL
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL =
      'mysql://root:root@localhost:3306/student_lms_test'

    vi.mocked(db.execute)
      .mockResolvedValueOnce([
        [{ TABLE_NAME: '_prisma_migrations' }, { TABLE_NAME: 'users' }],
      ] as never)
      .mockResolvedValue(undefined as never)

    const result = await resetDatabase()

    expect(result.truncatedTables).toEqual(['users'])
    expect(db.execute).toHaveBeenCalled()

    process.env.NODE_ENV = previous
    process.env.DATABASE_URL = previousDatabaseUrl
  })
})
