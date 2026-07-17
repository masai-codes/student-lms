import { beforeEach, describe, expect, it, vi } from 'vitest'

import { markSubmissionCompletedWithToken } from '../markSubmissionCompletedWithToken'
import { isApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn(), dbUpdate: vi.fn() }))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

function queueSelect(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

const setSpy = vi.fn(() => ({ where: () => Promise.resolve(undefined) }))

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

const LINK = 'https://assess.test/test?token=abc123'

describe('markSubmissionCompletedWithToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.dbUpdate.mockReturnValue({ set: setSpy })
  })

  it('rejects a blank token without touching the DB', async () => {
    await expectApiError(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: '   ',
      }),
      'TOKEN_REQUIRED',
    )
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('rejects when no submission exists', async () => {
    queueSelect([])
    await expectApiError(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'abc123',
      }),
      'SUBMISSION_NOT_FOUND',
    )
  })

  it('is idempotent when already marked complete', async () => {
    queueSelect([
      { id: 1, data: { assess_platform_link: LINK }, markAsCompleted: 1 },
    ])
    await expect(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'abc123',
      }),
    ).resolves.toEqual({ markAsCompleted: true })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('rejects when the stored assess link is missing', async () => {
    queueSelect([{ id: 1, data: {}, markAsCompleted: 0 }])
    await expectApiError(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'abc123',
      }),
      'ASSESS_PLATFORM_LINK_NOT_FOUND',
    )
  })

  it('rejects when the submission data is null', async () => {
    queueSelect([{ id: 1, data: null, markAsCompleted: null }])
    await expectApiError(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'abc123',
      }),
      'ASSESS_PLATFORM_LINK_NOT_FOUND',
    )
  })

  it('rejects when the token does not match the stored link', async () => {
    queueSelect([
      { id: 1, data: { assess_platform_link: LINK }, markAsCompleted: 0 },
    ])
    await expectApiError(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'wrong-token',
      }),
      'INVALID_TOKEN',
    )
  })

  it('marks the submission complete when the token matches', async () => {
    queueSelect([
      { id: 55, data: { assess_platform_link: LINK }, markAsCompleted: 0 },
    ])

    await expect(
      markSubmissionCompletedWithToken({
        userId: 7,
        assignmentId: 10,
        token: 'abc123',
      }),
    ).resolves.toEqual({ markAsCompleted: true })

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({ markAsCompleted: 1 }),
    )
  })
})
