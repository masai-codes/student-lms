import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

/** Mock the `select().from().where().orderBy()` chain to resolve `rows`. */
function mockRows(rows: Array<{ value: string; ordering: number }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      where: () => ({ orderBy: () => Promise.resolve(rows) }),
    }),
  })
}

describe('getSubcategoriesByCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps each menu row to a value + title-cased label', async () => {
    mockRows([
      { value: 'video-not-playing', ordering: 1 },
      { value: 'audio_issue', ordering: 2 },
    ])
    const { getSubcategoriesByCategory } = await import('../faqs.service')

    const result = await getSubcategoriesByCategory('lecture')

    expect(result).toEqual([
      { value: 'video-not-playing', label: 'Video Not Playing' },
      { value: 'audio_issue', label: 'Audio Issue' },
    ])
  })

  it('returns an empty list when the category has no subcategories', async () => {
    mockRows([])
    const { getSubcategoriesByCategory } = await import('../faqs.service')

    expect(await getSubcategoriesByCategory('resource')).toEqual([])
  })
})
