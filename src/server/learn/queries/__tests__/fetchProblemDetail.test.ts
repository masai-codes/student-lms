import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchAssignmentProblemDetailRow,
  fetchUserProblemSolution,
} from '@/server/learn/queries/fetchProblemDetail'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

describe('fetchProblemDetail queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the linked problem row or null', async () => {
    const row = {
      elementId: 3,
      problemId: 12,
      title: 'Two Sum',
      statement: 'Solve it',
      type: 'LINK',
    }
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: () => Promise.resolve([row]) }),
        }),
      }),
    })

    await expect(fetchAssignmentProblemDetailRow(99, 12)).resolves.toEqual(row)
  })

  it('returns null when the problem is not linked to the assignment', async () => {
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: () => Promise.resolve([]) }),
        }),
      }),
    })

    await expect(fetchAssignmentProblemDetailRow(99, 13)).resolves.toBeNull()
  })

  it('returns the latest user solution row', async () => {
    const row = {
      id: 7,
      submissionLink: 'https://x.test',
      status: 'submitted',
      submittedAt: '2026-05-20 10:00:00',
    }
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({ limit: () => Promise.resolve([row]) }),
          }),
        }),
      }),
    })

    await expect(fetchUserProblemSolution(5, 99, 12)).resolves.toEqual(row)
  })

  it('returns null when the user has no solution', async () => {
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({ limit: () => Promise.resolve([]) }),
          }),
        }),
      }),
    })

    await expect(fetchUserProblemSolution(5, 99, 12)).resolves.toBeNull()
  })
})
