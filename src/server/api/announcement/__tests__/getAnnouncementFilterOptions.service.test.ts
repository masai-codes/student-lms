import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

function mockMenuRows(rows: Array<{ value: string }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      where: () => ({ orderBy: () => Promise.resolve(rows) }),
    }),
  })
}

describe('getAnnouncementFilterOptions service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps menu rows to a deduped list of category values', async () => {
    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    mockMenuRows([
      { value: 'Lectures' },
      { value: 'DSA' },
      { value: 'Lectures' },
    ])

    await expect(getAnnouncementFilterOptions()).resolves.toEqual({
      categories: ['Lectures', 'DSA'],
    })
  })

  it('drops empty values and returns an empty list when there are no rows', async () => {
    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    mockMenuRows([{ value: '' }])
    await expect(getAnnouncementFilterOptions()).resolves.toEqual({
      categories: [],
    })
  })
})
