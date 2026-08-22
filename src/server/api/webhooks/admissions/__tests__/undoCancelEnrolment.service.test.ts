import { beforeEach, describe, expect, it, vi } from 'vitest'

import { undoCancelEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/undoCancelEnrolment.service'

const FAKE_TX = { tx: true }
const CANCELLED_BATCH_USER = {
  id: 55,
  userId: 7,
  batchId: 10,
  meta: '{"batchEnrolmentCancelled":true}',
  history: null,
  status: 'enrolment_cancelled',
  deletedAt: '2026-08-01T00:00:00.000Z',
}

const findBatchUserByEnrolmentId = vi.hoisted(() => vi.fn())
const reviveCancelledBatchUser = vi.hoisted(() => vi.fn())
const reviveCancelledSectionUsers = vi.hoisted(() => vi.fn())
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
vi.mock(
  '@/server/api/webhooks/admissions/steps/reviveCancelledBatchUser',
  () => ({ reviveCancelledBatchUser }),
)
vi.mock(
  '@/server/api/webhooks/admissions/steps/reviveCancelledSectionUsers',
  () => ({ reviveCancelledSectionUsers }),
)
vi.mock('@/server/batches/portalEnrollmentCache', () => ({
  invalidatePortalEnrollmentCache,
}))

const input = { enrolment_id: 123 } as never

beforeEach(() => {
  vi.clearAllMocks()
  findBatchUserByEnrolmentId.mockResolvedValue(CANCELLED_BATCH_USER)
  reviveCancelledSectionUsers.mockResolvedValue([901, 902])
})

describe('undoCancelEnrolmentFromAdmissions', () => {
  it('revives the batch_user + its cancelled section_users and reports what changed', async () => {
    const result = await undoCancelEnrolmentFromAdmissions(input)

    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, {
      enrolmentId: 123,
      client: undefined,
      batchId: undefined,
    })
    expect(reviveCancelledBatchUser).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchUserId: 55 }),
    )
    expect(reviveCancelledSectionUsers).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
    })
    expect(result).toEqual({
      batchUserId: 55,
      userId: 7,
      batchId: 10,
      revivedSectionUserIds: [901, 902],
      alreadyActive: false,
    })
  })

  it('forwards the payload client and batch_id to the lookup as extra filters', async () => {
    await undoCancelEnrolmentFromAdmissions({
      enrolment_id: 123,
      client: 'ihub',
      batch_id: 10,
    })
    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, {
      enrolmentId: 123,
      client: 'ihub',
      batchId: 10,
    })
  })

  it('revives a row flagged cancelled even if it was never soft-deleted', async () => {
    findBatchUserByEnrolmentId.mockResolvedValue({
      ...CANCELLED_BATCH_USER,
      deletedAt: null,
    })

    const result = await undoCancelEnrolmentFromAdmissions(input)

    expect(reviveCancelledBatchUser).toHaveBeenCalled()
    expect(result.alreadyActive).toBe(false)
  })

  it('no-ops on an already-live row instead of writing a second revive', async () => {
    findBatchUserByEnrolmentId.mockResolvedValue({
      ...CANCELLED_BATCH_USER,
      status: 'active',
      deletedAt: null,
    })

    const result = await undoCancelEnrolmentFromAdmissions(input)

    expect(reviveCancelledBatchUser).not.toHaveBeenCalled()
    expect(reviveCancelledSectionUsers).not.toHaveBeenCalled()
    expect(result).toEqual({
      batchUserId: 55,
      userId: 7,
      batchId: 10,
      revivedSectionUserIds: [],
      alreadyActive: true,
    })
  })

  it('clears the cached enrolment sets for the student', async () => {
    await undoCancelEnrolmentFromAdmissions(input)
    expect(invalidatePortalEnrollmentCache).toHaveBeenCalledWith(7)
  })

  it('does not clear the cache when the enrolment is unknown', async () => {
    findBatchUserByEnrolmentId.mockRejectedValue(new Error('not found'))

    await expect(undoCancelEnrolmentFromAdmissions(input)).rejects.toThrow(
      'not found',
    )
    expect(invalidatePortalEnrollmentCache).not.toHaveBeenCalled()
  })
})
