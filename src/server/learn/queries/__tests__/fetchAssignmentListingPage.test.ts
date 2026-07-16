import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FetchAssignmentListingPageInput } from '@/server/learn/queries/fetchAssignmentListingPage'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)

function baseInput(
  overrides: Partial<FetchAssignmentListingPageInput> = {},
): FetchAssignmentListingPageInput {
  return {
    learningType: 'assignment',
    batchId: 10,
    sectionIds: [9],
    userId: 7,
    window: { gte: null, lt: '2026-06-22 18:30:00' },
    page: 1,
    pageSize: 25,
    nowMs: NOW_MS,
    ...overrides,
  }
}

function assignmentRow(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Assignment ${id}`,
    category: 'coding',
    type: 'evaluation',
    optional: 0,
    schedule: '2026-06-01 10:00:00',
    concludes: '2026-06-02 10:00:00',
    week: 1,
    module: null,
    hostName: 'Ananya Singh',
    ...overrides,
  }
}

function mockNarrowedRows(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        where: () => ({ orderBy: () => Promise.resolve(rows) }),
      }),
    }),
  })
}

function mockSubmissions(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ orderBy: () => Promise.resolve(rows) }) }),
  })
}

describe('fetchAssignmentListingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty page when the user has no sections', async () => {
    const { fetchAssignmentListingPage } =
      await import('../fetchAssignmentListingPage')
    const result = await fetchAssignmentListingPage(
      baseInput({ sectionIds: [] }),
    )
    expect(result.rows).toEqual([])
    expect(result.progressById.size).toBe(0)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns an empty page without a submissions query when nothing matches', async () => {
    const { fetchAssignmentListingPage } =
      await import('../fetchAssignmentListingPage')
    mockNarrowedRows([])
    const result = await fetchAssignmentListingPage(baseInput())
    expect(result.rows).toEqual([])
    expect(result.progressById.size).toBe(0)
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })

  it('computes progress for every row and keeps the latest submission per assignment', async () => {
    const { fetchAssignmentListingPage } =
      await import('../fetchAssignmentListingPage')
    mockNarrowedRows([assignmentRow(55), assignmentRow(56)])
    mockSubmissions([
      // newest first: the first row wins, the second (older) is ignored.
      {
        assignmentId: 55,
        completed: 1,
        status: 'submitted',
        markAsCompleted: 0,
      },
      { assignmentId: 55, completed: 0, status: 'pending', markAsCompleted: 0 },
    ])

    const result = await fetchAssignmentListingPage(baseInput())
    expect(result.progressById.get(55)).toBe('completed')
    expect(result.progressById.get(56)).toBe('overdue')
    expect(result.rows).toHaveLength(2)
    expect(result.pagination.totalItems).toBe(2)
  })

  it('filters by the requested progress statuses', async () => {
    const { fetchAssignmentListingPage } =
      await import('../fetchAssignmentListingPage')
    mockNarrowedRows([assignmentRow(55), assignmentRow(56)])
    mockSubmissions([
      {
        assignmentId: 55,
        completed: 1,
        status: 'submitted',
        markAsCompleted: 0,
      },
    ])

    const result = await fetchAssignmentListingPage(
      baseInput({ filters: { assignmentProgressStatuses: ['completed'] } }),
    )
    expect(result.rows.map((row) => row.id)).toEqual([55])
    expect(result.pagination.totalItems).toBe(1)
  })
})
