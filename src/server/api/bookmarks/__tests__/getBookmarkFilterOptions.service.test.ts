import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbExecute: vi.fn() }))

vi.mock('@/db', () => ({ db: { execute: hoisted.dbExecute } }))

describe('getBookmarkFilterOptions service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns distinct sorted categories + modules for lectures', async () => {
    hoisted.dbExecute.mockResolvedValueOnce([
      [
        { category: 'DSA', module: 'Module 2' },
        { category: 'Coding', module: 'Module 1' },
        { category: 'DSA', module: null },
        { category: '', module: '' },
      ],
    ])
    const { getBookmarkFilterOptions } =
      await import('../getBookmarkFilterOptions.service')
    await expect(getBookmarkFilterOptions(7, 'lectures')).resolves.toEqual({
      categories: ['Coding', 'DSA'],
      modules: ['Module 1', 'Module 2'],
      statuses: [],
      priorities: [],
    })
  })
})
