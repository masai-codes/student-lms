import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAssignmentSubmission } from '../createAssignmentSubmission'
import { isApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn(), dbInsert: vi.fn() }))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))

// Each db.select() call resolves to the next queued row-set.
function queueSelect(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

async function expectApiError(promise: Promise<unknown>, code: string) {
  await promise.then(
    () => {
      throw new Error('expected rejection')
    },
    (error: unknown) => {
      expect(isApiError(error)).toBe(true)
      expect((error as { code: string }).code).toBe(code)
    },
  )
}

describe('createAssignmentSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an invalid assignment id without touching the DB', async () => {
    await expectApiError(
      createAssignmentSubmission({ assignmentId: 0, userId: 7 }),
      'INVALID_ASSIGNMENT_ID',
    )
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('rejects when a submission already exists', async () => {
    queueSelect([{ id: 1 }]) // existing submission
    await expectApiError(
      createAssignmentSubmission({ assignmentId: 10, userId: 7 }),
      'SUBMISSION_ALREADY_EXISTS',
    )
  })

  it('rejects when the assignment is missing', async () => {
    queueSelect([]) // no existing submission
    queueSelect([]) // assignment not found
    await expectApiError(
      createAssignmentSubmission({ assignmentId: 10, userId: 7 }),
      'ASSIGNMENT_NOT_FOUND',
    )
  })

  it('rejects when the user is not enrolled in the section', async () => {
    queueSelect([]) // no existing submission
    queueSelect([{ sectionId: 55 }]) // assignment with a section
    queueSelect([]) // no enrollment
    await expectApiError(
      createAssignmentSubmission({ assignmentId: 10, userId: 7 }),
      'USER_NOT_ENROLLED_IN_SECTION',
    )
  })

  it('creates a submission and returns its id (no section gate)', async () => {
    queueSelect([]) // no existing submission
    queueSelect([{ sectionId: null }]) // assignment with no section
    hoisted.dbInsert.mockReturnValueOnce({
      values: () => Promise.resolve([{ insertId: 4321 }]),
    })

    await expect(
      createAssignmentSubmission({ assignmentId: 10, userId: 7 }),
    ).resolves.toEqual({ id: 4321 })
  })
})
