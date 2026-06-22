import { beforeEach, describe, expect, it, vi } from 'vitest'

import { submitSolutionForUser } from '@/server/assignments/services/submitSolution.service'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn(), dbUpdate: vi.fn() }))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

function mockOwnership(rows: Array<{ id: number }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      innerJoin: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
    }),
  })
}

describe('submitSolutionForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the solution and returns the submitted state when owned', async () => {
    mockOwnership([{ id: 7 }])
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockReturnValue({ where })
    hoisted.dbUpdate.mockReturnValueOnce({ set })

    const result = await submitSolutionForUser({
      userId: 5,
      solutionId: 7,
      submissionLink: 'https://x.test',
    })

    expect(result).toEqual({ status: 'submitted', submissionLink: 'https://x.test' })
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionLink: 'https://x.test',
        status: 'submitted',
      }),
    )
  })

  it('throws a 404 ApiError when the solution is not owned by the user', async () => {
    mockOwnership([])

    await expect(
      submitSolutionForUser({ userId: 5, solutionId: 7, submissionLink: 'https://x.test' }),
    ).rejects.toMatchObject({ status: 404, code: 'SOLUTION_NOT_FOUND' })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })
})
