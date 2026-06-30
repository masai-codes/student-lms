import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelectDistinct: vi.fn() }))

vi.mock('@/db', () => ({ db: { selectDistinct: hoisted.dbSelectDistinct } }))

const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)

function mockFacetRows(rows: Array<unknown>) {
  hoisted.dbSelectDistinct.mockReturnValueOnce({
    from: () => ({ leftJoin: () => ({ where: () => Promise.resolve(rows) }) }),
  })
}

describe('fetchLearnListingFacets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty facets when the user has no sections', async () => {
    const { fetchLearnListingFacets } =
      await import('../fetchLearnListingFacets')
    const result = await fetchLearnListingFacets('lecture', [], NOW_MS)
    expect(result).toEqual({
      moduleFilterValues: [],
      categoryFilterValues: [],
      typeFilterValues: [],
      priorityFilterValues: [],
      instructorFilterValues: [],
    })
    expect(hoisted.dbSelectDistinct).not.toHaveBeenCalled()
  })

  it('builds deduped, sorted facet values for lectures (incl. unknown instructor + week fallback)', async () => {
    const { fetchLearnListingFacets } =
      await import('../fetchLearnListingFacets')
    mockFacetRows([
      {
        category: 'coding',
        type: 'live',
        optional: 0,
        module: 'Advanced',
        week: 2,
        hostName: 'Zara',
      },
      {
        category: 'coding',
        type: 'recorded',
        optional: 1,
        module: null,
        week: 1,
        hostName: null,
      },
    ])

    const result = await fetchLearnListingFacets('lecture', [9], NOW_MS)
    expect(result.categoryFilterValues).toEqual(['coding'])
    expect(result.typeFilterValues).toEqual(['live', 'recorded'])
    expect(result.priorityFilterValues).toEqual(['mandatory', 'recommended'])
    expect(result.instructorFilterValues).toEqual([
      'Unknown Instructor',
      'Zara',
    ])
    expect(result.moduleFilterValues).toEqual(['Advanced', 'Module 1'])
  })

  it('queries the assignments table for assignment facets', async () => {
    const { fetchLearnListingFacets } =
      await import('../fetchLearnListingFacets')
    mockFacetRows([
      {
        category: 'project',
        type: 'evaluation',
        optional: 0,
        module: 'Capstone',
        week: 4,
        hostName: 'Ed',
      },
    ])

    const result = await fetchLearnListingFacets('assignment', [9], NOW_MS)
    expect(result.typeFilterValues).toEqual(['evaluation'])
    expect(result.moduleFilterValues).toEqual(['Capstone'])
  })

  it('scopes resources to the reading type', async () => {
    const { fetchLearnListingFacets } =
      await import('../fetchLearnListingFacets')
    mockFacetRows([
      {
        category: 'reference',
        type: 'reading',
        optional: 1,
        module: null,
        week: 3,
        hostName: 'Mia',
      },
    ])

    const result = await fetchLearnListingFacets('resource', [9], NOW_MS)
    expect(result.typeFilterValues).toEqual(['reading'])
    expect(result.moduleFilterValues).toEqual(['Module 3'])
  })
})
