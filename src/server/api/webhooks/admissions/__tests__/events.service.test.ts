import { beforeEach, describe, expect, it, vi } from 'vitest'

import { processAdmissionEvent } from '@/server/api/webhooks/admissions/events.service'

const FAKE_TX = { tx: true }
const BATCH_USER = {
  id: 55,
  userId: 7,
  batchId: 10,
  meta: null,
  history: null,
}

const findBatchUserByEnrolmentId = vi.hoisted(() => vi.fn())
const updateAdmissionDataForBatch = vi.hoisted(() => vi.fn())
const appendBatchUserPayloadHistory = vi.hoisted(() => vi.fn())
const applyBatchTransfer = vi.hoisted(() => vi.fn())
const pauseBatchUser = vi.hoisted(() => vi.fn())
const unpauseBatchUser = vi.hoisted(() => vi.fn())
const invalidatePortalEnrollmentCache = vi.hoisted(() => vi.fn())

// db.transaction just runs the callback with a fake tx.
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
  '@/server/api/webhooks/admissions/steps/updateAdmissionDataForBatch',
  () => ({ updateAdmissionDataForBatch }),
)
vi.mock(
  '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory',
  () => ({ appendBatchUserPayloadHistory }),
)
vi.mock('@/server/api/webhooks/admissions/steps/applyBatchTransfer', () => ({
  applyBatchTransfer,
}))
vi.mock('@/server/api/webhooks/admissions/steps/pauseBatchUser', () => ({
  pauseBatchUser,
}))
vi.mock('@/server/api/webhooks/admissions/steps/unpauseBatchUser', () => ({
  unpauseBatchUser,
}))
vi.mock('@/server/batches/portalEnrollmentCache', () => ({
  invalidatePortalEnrollmentCache,
}))

function event(type: string, data: Record<string, unknown> = {}) {
  return { id: 1, type, data: { enrolment_id: 123, ...data } } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  findBatchUserByEnrolmentId.mockResolvedValue(BATCH_USER)
})

describe('processAdmissionEvent', () => {
  it('lms.batch.paid → marks full fees paid (assumed true) + records payload', async () => {
    const result = await processAdmissionEvent(event('lms.batch.paid'))

    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(
      FAKE_TX,
      123,
      undefined,
    )
    expect(updateAdmissionDataForBatch).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
      values: { fullFeesPaid: 1 },
    })
    expect(appendBatchUserPayloadHistory).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({
        batchUserId: 55,
        type: 'full_payment_received',
      }),
    )
    expect(result).toEqual({ event: 'lms.batch.paid', batchUserId: 55 })
  })

  it.each([
    [
      'lms.batch.transfer.considered',
      'considered',
      'batch_transfer_considered',
    ],
    ['lms.batch.transfer.rejected', 'rejected', 'batch_transfer_rejected'],
    ['lms.batch.transfer.completed', 'completed', 'batch_transfer_completed'],
  ])(
    '%s → applyBatchTransfer with status %s',
    async (type, status, payloadType) => {
      await processAdmissionEvent(event(type, { to_batch_id: 22 }))

      expect(applyBatchTransfer).toHaveBeenCalledWith(
        FAKE_TX,
        expect.objectContaining({
          batchUserId: 55,
          batchTransferId: 22,
          status,
          payloadType,
        }),
      )
    },
  )

  it('lms.batch.pause → pauseBatchUser', async () => {
    await processAdmissionEvent(event('lms.batch.pause'))
    expect(pauseBatchUser).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchUserId: 55 }),
    )
    expect(unpauseBatchUser).not.toHaveBeenCalled()
  })

  it('lms.batch.unpause → unpauseBatchUser', async () => {
    await processAdmissionEvent(event('lms.batch.unpause'))
    expect(unpauseBatchUser).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchUserId: 55 }),
    )
    expect(pauseBatchUser).not.toHaveBeenCalled()
  })

  it('lms.invoice.generated → updates full_fees_paid_invoice + records payload', async () => {
    await processAdmissionEvent(
      event('lms.invoice.generated', {
        full_fees_paid_invoice: 'https://cdn/inv.pdf',
      }),
    )
    expect(updateAdmissionDataForBatch).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
      values: { fullFeesPaidInvoice: 'https://cdn/inv.pdf' },
    })
    expect(appendBatchUserPayloadHistory).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ type: 'invoice_generated' }),
    )
  })

  it('lms.fee.deadline.updated → updates course_fee_deadline + records payload', async () => {
    await processAdmissionEvent(
      event('lms.fee.deadline.updated', {
        course_fee_deadline: '2026-09-01 00:00:00',
      }),
    )
    expect(updateAdmissionDataForBatch).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
      values: { courseFeeDeadline: '2026-09-01 00:00:00' },
    })
    expect(appendBatchUserPayloadHistory).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ type: 'fee_deadline_updated' }),
    )
  })

  it('forwards data.lms_batch_user_id to the lookup for disambiguation', async () => {
    await processAdmissionEvent(
      event('lms.batch.pause', { lms_batch_user_id: 456 }),
    )
    expect(findBatchUserByEnrolmentId).toHaveBeenCalledWith(FAKE_TX, 123, 456)
  })

  it.each([
    'lms.batch.paid',
    'lms.batch.pause',
    'lms.batch.unpause',
    'lms.invoice.generated',
    'lms.fee.deadline.updated',
  ])('%s → clears the cached enrolment sets for the student', async (type) => {
    await processAdmissionEvent(
      event(type, {
        full_fees_paid_invoice: 'https://cdn/inv.pdf',
        course_fee_deadline: '2026-09-01 00:00:00',
      }),
    )
    expect(invalidatePortalEnrollmentCache).toHaveBeenCalledWith(7)
  })

  it('does not clear the cache when the event fails', async () => {
    findBatchUserByEnrolmentId.mockRejectedValue(new Error('not found'))

    await expect(
      processAdmissionEvent(event('lms.batch.pause')),
    ).rejects.toThrow('not found')
    expect(invalidatePortalEnrollmentCache).not.toHaveBeenCalled()
  })

  it('dumps the whole envelope as the stored payload', async () => {
    await processAdmissionEvent(event('lms.batch.pause', { extra: 'kept' }))
    expect(pauseBatchUser).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({
        payload: expect.objectContaining({
          type: 'lms.batch.pause',
          data: expect.objectContaining({ enrolment_id: 123, extra: 'kept' }),
        }),
      }),
    )
  })
})
