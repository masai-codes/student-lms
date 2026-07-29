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
    const { getBookmarkFilterOptions } = await import(
      '../getBookmarkFilterOptions.service'
    )
    await expect(getBookmarkFilterOptions(7, 'lectures')).resolves.toEqual({
      categories: ['Coding', 'DSA'],
      modules: ['Module 1', 'Module 2'],
      statuses: [],
      priorities: [],
    })
  })

  it('returns category + status + priority for tickets', async () => {
    hoisted.dbExecute.mockResolvedValueOnce([
      [
        { category: 'Billing', status: 'open', priority: 'high' },
        { category: 'Billing', status: 'closed', priority: 'low' },
      ],
    ])
    const { getBookmarkFilterOptions } = await import(
      '../getBookmarkFilterOptions.service'
    )
    await expect(getBookmarkFilterOptions(7, 'tickets')).resolves.toEqual({
      categories: ['Billing'],
      modules: [],
      statuses: ['closed', 'open'],
      priorities: ['high', 'low'],
    })
  })

  it('returns empty options for masaiverse without querying', async () => {
    const { getBookmarkFilterOptions } = await import(
      '../getBookmarkFilterOptions.service'
    )
    await expect(getBookmarkFilterOptions(7, 'masaiverse')).resolves.toEqual({
      categories: [],
      modules: [],
      statuses: [],
      priorities: [],
    })
    expect(hoisted.dbExecute).not.toHaveBeenCalled()
  })
})
