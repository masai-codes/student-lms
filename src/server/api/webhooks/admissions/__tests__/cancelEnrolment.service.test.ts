import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cancelEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/cancelEnrolment.service'

const FAKE_TX = { tx: true }
const BATCH_USER = {
  id: 55,
  userId: 7,
  batchId: 10,
  meta: null,
  history: null,
}

const findBatchUserByEnrolmentId = vi.hoisted(() => vi.fn())
const cancelBatchUser = vi.hoisted(() => vi.fn())
const cancelSectionUsers = vi.hoisted(() => vi.fn())
const invalidatePortalEnrollmentCache = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: { transaction: (cb: (tx: unknown) => unknown) => cb(FAKE_TX) },
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock(
  '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId',
  () => ({ findBatchUserByEnrolmentId }),
)
vi.mock('@/server/api/webhooks/admissions/steps/cancelBatchUser', () => ({
  cancelBatchUser,
}))
vi.mock('@/server/api/webhooks/admissions/steps/cancelSectionUsers', () => ({
  cancelSectionUsers,
}))
vi.mock('@/server/batches/portalEnrollmentCache', () => ({
  invalidatePortalEnrollmentCache,
}))

const input = { enrolment_id: 123 } as never

beforeEach(() => {
  vi.clearAllMocks()
  findBatchUserByEnrolmentId.mockResolvedValue(BATCH_USER)
  cancelSectionUsers.mockResolvedValue([901, 902])
})

describe('cancelEnrolmentFromAdmissions', () => {
  it('cancels the batch_user + its section_users and reports what changed', async () => {
    const result = await cancelEnrolmentFromAdmissions(input)

    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, {
      enrolmentId: 123,
      client: undefined,
      batchId: undefined,
    })
    expect(cancelBatchUser).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchUserId: 55 }),
    )
    expect(cancelSectionUsers).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
    })
    expect(result).toEqual({
      batchUserId: 55,
      userId: 7,
      batchId: 10,
      cancelledSectionUserIds: [901, 902],
    })
  })

  it('forwards the payload client to the lookup as an extra filter', async () => {
    await cancelEnrolmentFromAdmissions({ enrolment_id: 123, client: 'ihub' })
    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, {
      enrolmentId: 123,
      client: 'ihub',
      batchId: undefined,
    })
  })

  it('forwards the payload batch_id to the lookup as an extra filter', async () => {
    await cancelEnrolmentFromAdmissions({ enrolment_id: 123, batch_id: 10 })
    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, {
      enrolmentId: 123,
      client: undefined,
      batchId: 10,
    })
  })

  it('treats a null batch_id as "not specified"', async () => {
    await cancelEnrolmentFromAdmissions({ enrolment_id: 123, batch_id: null })
    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchId: undefined }),
    )
  })

  it('clears the cached enrolment sets for the student', async () => {
    await cancelEnrolmentFromAdmissions(input)
    expect(invalidatePortalEnrollmentCache).toHaveBeenCalledWith(7)
  })

  it('does not clear the cache when the enrolment is unknown', async () => {
    findBatchUserByEnrolmentId.mockRejectedValue(new Error('not found'))

    await expect(cancelEnrolmentFromAdmissions(input)).rejects.toThrow(
      'not found',
    )
    expect(invalidatePortalEnrollmentCache).not.toHaveBeenCalled()
  })
})
