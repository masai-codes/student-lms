import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  applyFeeDeadlineUpdated,
  applyInvoiceGenerated,
} from '@/server/api/webhooks/admissions/steps/applyAdmissionDataEvent'

const FAKE_TX = { tx: true } as never
const BATCH_USER = {
  id: 55,
  userId: 7,
  batchId: 10,
  meta: null,
  history: null,
  status: 'active',
  deletedAt: null,
}

const updateAdmissionDataForBatch = vi.hoisted(() => vi.fn())
const appendBatchUserPayloadHistory = vi.hoisted(() => vi.fn())

vi.mock(
  '@/server/api/webhooks/admissions/steps/updateAdmissionDataForBatch',
  () => ({ updateAdmissionDataForBatch }),
)
vi.mock(
  '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory',
  () => ({ appendBatchUserPayloadHistory }),
)

function event(type: string, data: Record<string, unknown>) {
  return { id: 1, type, data: { enrolment_id: 123, ...data } } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('applyInvoiceGenerated', () => {
  it('writes the invoice url + appends the payload', async () => {
    await applyInvoiceGenerated(
      FAKE_TX,
      event('lms.invoice.generated', {
        full_fees_paid_invoice: 'https://cdn/inv.pdf',
      }),
      BATCH_USER,
    )

    expect(updateAdmissionDataForBatch).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      batchId: 10,
      values: { fullFeesPaidInvoice: 'https://cdn/inv.pdf' },
    })
    expect(appendBatchUserPayloadHistory).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ batchUserId: 55, type: 'invoice_generated' }),
    )
  })

  it('rejects a payload without an invoice url', async () => {
    await expect(
      applyInvoiceGenerated(
        FAKE_TX,
        event('lms.invoice.generated', {}),
        BATCH_USER,
      ),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_ENROLMENT_PAYLOAD' })
    expect(updateAdmissionDataForBatch).not.toHaveBeenCalled()
  })
})

describe('applyFeeDeadlineUpdated', () => {
  it('writes the new deadline + appends the payload', async () => {
    await applyFeeDeadlineUpdated(
      FAKE_TX,
      event('lms.fee.deadline.updated', {
        course_fee_deadline: '2026-09-01 00:00:00',
      }),
      BATCH_USER,
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

  it('rejects a payload without a deadline', async () => {
    await expect(
      applyFeeDeadlineUpdated(
        FAKE_TX,
        event('lms.fee.deadline.updated', {}),
        BATCH_USER,
      ),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_ENROLMENT_PAYLOAD' })
    expect(appendBatchUserPayloadHistory).not.toHaveBeenCalled()
  })
})
