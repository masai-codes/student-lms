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

  it('returns categories + distinct announcers for the user sections', async () => {
    mockCategories([{ value: 'DSA' }, { value: 'General' }])
    mockSections([{ sectionId: 9 }])
    hoisted.dbExecute.mockResolvedValueOnce([
      [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Zed' },
      ],
    ])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    await expect(getAnnouncementFilterOptions(7)).resolves.toEqual({
      categories: ['DSA', 'General'],
      announcers: [
        { id: '1', name: 'Ada' },
        { id: '2', name: 'Zed' },
      ],
    })
  })

  it('returns no announcers when the user has no sections', async () => {
    mockCategories([{ value: 'DSA' }])
    mockSections([])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    await expect(getAnnouncementFilterOptions(7)).resolves.toEqual({
      categories: ['DSA'],
      announcers: [],
    })
    expect(hoisted.dbExecute).not.toHaveBeenCalled()
  })

  it('drops announcers with blank names', async () => {
    mockCategories([])
    mockSections([{ sectionId: 9 }])
    hoisted.dbExecute.mockResolvedValueOnce([
      [
        { id: 1, name: 'Ada' },
        { id: 3, name: '' },
      ],
    ])

    const { getAnnouncementFilterOptions } = await import(
      '../getAnnouncementFilterOptions.service'
    )
    const result = await getAnnouncementFilterOptions(7)
    expect(result.announcers).toEqual([{ id: '1', name: 'Ada' }])
  })
})
