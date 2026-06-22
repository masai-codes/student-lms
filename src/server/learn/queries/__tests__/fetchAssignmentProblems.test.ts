import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchAssignmentProblemRows,
  fetchSolutionStatusesBySubmission,
} from '@/server/learn/queries/fetchAssignmentProblems'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

describe('fetchAssignmentProblems queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches assignment problem rows ordered by priority', async () => {
    const rows = [{ elementId: 5, problemId: 12, title: 'Two Sum' }]
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ orderBy: () => Promise.resolve(rows) }),
        }),
      }),
    })

    await expect(fetchAssignmentProblemRows(99)).resolves.toEqual(rows)
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })

  it('fetches solution statuses for a submission', async () => {
    const rows = [{ problemId: 12, status: 'submitted' }]
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(rows) }),
    })

    await expect(fetchSolutionStatusesBySubmission(7)).resolves.toEqual(rows)
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })
})
