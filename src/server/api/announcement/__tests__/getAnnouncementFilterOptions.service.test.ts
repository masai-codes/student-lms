import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn(), dbExecute: vi.fn() }))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, execute: hoisted.dbExecute },
}))

function mockCategories(rows: Array<{ value: string }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ orderBy: () => Promise.resolve(rows) }) }),
  })
}

function mockSections(rows: Array<{ sectionId: number }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

describe('getAnnouncementFilterOptions service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merges announcement + message authors, deduped and sorted by name', async () => {
    mockCategories([{ value: 'DSA' }, { value: 'General' }])
    mockSections([{ sectionId: 9 }])
    // db.execute #1 = announcement authors, #2 = message authors
    hoisted.dbExecute
      .mockResolvedValueOnce([[{ id: 2, name: 'Indrani' }]])
      .mockResolvedValueOnce([
        [
          { id: 5, name: 'Mridul Katara' },
          { id: 2, name: 'Indrani' }, // duplicate across sources
          { id: 7, name: 'Nihal' },
        ],
      ])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    await expect(getAnnouncementFilterOptions(7)).resolves.toEqual({
      categories: ['DSA', 'General'],
      announcers: [
        { id: '2', name: 'Indrani' },
        { id: '5', name: 'Mridul Katara' },
        { id: '7', name: 'Nihal' },
      ],
    })
    expect(hoisted.dbExecute).toHaveBeenCalledTimes(2)
  })

  it('still returns message authors when the user has no sections', async () => {
    mockCategories([{ value: 'DSA' }])
    mockSections([])
    // Only the message-authors query runs (no announcement query without sections)
    hoisted.dbExecute.mockResolvedValueOnce([[{ id: 5, name: 'Mridul Katara' }]])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    await expect(getAnnouncementFilterOptions(7)).resolves.toEqual({
      categories: ['DSA'],
      announcers: [{ id: '5', name: 'Mridul Katara' }],
    })
    expect(hoisted.dbExecute).toHaveBeenCalledTimes(1)
  })

  it('drops authors with blank names', async () => {
    mockCategories([])
    mockSections([{ sectionId: 9 }])
    hoisted.dbExecute
      .mockResolvedValueOnce([[{ id: 1, name: 'Ada' }, { id: 3, name: '' }]])
      .mockResolvedValueOnce([[]])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    const result = await getAnnouncementFilterOptions(7)
    expect(result.announcers).toEqual([{ id: '1', name: 'Ada' }])
  })
})
