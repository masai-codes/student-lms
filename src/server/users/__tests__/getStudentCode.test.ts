import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getStudentCodeForBatch,
  getStudentCodesForUser,
  resolveStudentCode,
} from '../getStudentCode'

const hoisted = vi.hoisted(() => ({
  queue: [] as Array<Array<Record<string, unknown>>>,
}))

// `.orderBy()` shifts the next result set and is both awaitable (all codes) and
// chainable to `.limit()` (single batch-scoped code).
vi.mock('@/db', () => {
  const orderBy = () => {
    const rows = hoisted.queue.shift() ?? []
    return {
      limit: () => Promise.resolve(rows),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(rows).then(res, rej),
    }
  }
  return {
    db: { select: () => ({ from: () => ({ where: () => ({ orderBy }) }) }) },
  }
})

beforeEach(() => {
  hoisted.queue = []
})

describe('getStudentCodeForBatch', () => {
  it('returns the trimmed code on the batch enrolment', async () => {
    hoisted.queue = [[{ username: ' MSN-001 ' }]]
    await expect(getStudentCodeForBatch(1, 5)).resolves.toBe('MSN-001')
  })

  it('returns null when the enrolment carries no username', async () => {
    hoisted.queue = [[{ username: '  ' }]]
    await expect(getStudentCodeForBatch(1, 5)).resolves.toBeNull()
  })

  it('returns null when there is no enrolment row', async () => {
    hoisted.queue = [[]]
    await expect(getStudentCodeForBatch(1, 5)).resolves.toBeNull()
  })
})

describe('getStudentCodesForUser', () => {
  it('dedupes codes and keeps the enrolment order', async () => {
    hoisted.queue = [
      [
        { username: 'MSN-002', batchId: 9 },
        { username: 'MSN-002', batchId: 8 },
        { username: 'MSN-001', batchId: 5 },
        { username: null, batchId: 4 },
      ],
    ]
    await expect(getStudentCodesForUser(1)).resolves.toEqual([
      { code: 'MSN-002', batchId: 9 },
      { code: 'MSN-001', batchId: 5 },
    ])
  })
})

describe('resolveStudentCode', () => {
  it('prefers the code on the requested batch', async () => {
    hoisted.queue = [[{ username: 'MSN-001' }]]
    await expect(resolveStudentCode(1, 5)).resolves.toBe('MSN-001')
  })

  it('falls back to the most recent code from any batch', async () => {
    hoisted.queue = [[], [{ username: 'MSN-009', batchId: 9 }]]
    await expect(resolveStudentCode(1, 5)).resolves.toBe('MSN-009')
  })

  it('returns an empty string when the user has no student code at all', async () => {
    hoisted.queue = [[], []]
    await expect(resolveStudentCode(1, 5)).resolves.toBe('')
  })

  it('skips the batch lookup when no batch is given', async () => {
    hoisted.queue = [[{ username: 'MSN-009', batchId: 9 }]]
    await expect(resolveStudentCode(1)).resolves.toBe('MSN-009')
  })
})
