import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FetchLectureListingPageInput } from '@/server/learn/queries/fetchLectureListingPage'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

function baseInput(
  overrides: Partial<FetchLectureListingPageInput> = {},
): FetchLectureListingPageInput {
  return {
    learningType: 'lecture',
    batchId: 10,
    sectionIds: [9],
    userId: 7,
    window: { gte: null, lt: '2026-06-23 12:00:00' },
    nowMs: Date.UTC(2026, 5, 22, 12, 0, 0),
    page: 1,
    pageSize: 25,
    ...overrides,
  }
}

function mockCount(value: number) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({ where: () => Promise.resolve([{ value }]) }),
    }),
  })
}

function mockRows(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        leftJoin: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({ offset: () => Promise.resolve(rows) }),
            }),
          }),
        }),
      }),
    }),
  })
}

describe('fetchLectureListingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty page without querying when the user has no sections', async () => {
    const { fetchLectureListingPage } =
      await import('../fetchLectureListingPage')
    const result = await fetchLectureListingPage(baseInput({ sectionIds: [] }))
    expect(result.rows).toEqual([])
    expect(result.pagination.totalItems).toBe(0)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('skips the rows query when the count is zero', async () => {
    const { fetchLectureListingPage } =
      await import('../fetchLectureListingPage')
    mockCount(0)
    const result = await fetchLectureListingPage(baseInput())
    expect(result.rows).toEqual([])
    expect(result.pagination.totalItems).toBe(0)
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })

  it('returns the page rows with the resolved pagination envelope', async () => {
    const { fetchLectureListingPage } =
      await import('../fetchLectureListingPage')
    const rows = [{ id: 1 }, { id: 2 }]
    mockCount(40)
    mockRows(rows)
    const result = await fetchLectureListingPage(
      baseInput({ pageSize: 25, page: 1 }),
    )
    expect(result.rows).toBe(rows)
    expect(result.pagination).toMatchObject({
      totalItems: 40,
      totalPages: 2,
      hasNextPage: true,
    })
  })
})
