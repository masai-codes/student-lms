import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applyTransferEvent } from '@/server/api/webhooks/admissions/steps/applyTransferEvent'

const FAKE_TX = { tx: true } as never
const BATCH_USER = { id: 55, history: null }

const applyBatchTransfer = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/steps/applyBatchTransfer', () => ({
  applyBatchTransfer,
}))

function transferEvent(type: string, toBatchId: number | null) {
  return {
    id: 1,
    type,
    data: { enrolment_id: 123, to_batch_id: toBatchId },
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('applyTransferEvent', () => {
  it.each([
    [
      'lms.batch.transfer.considered',
      'considered',
      'batch_transfer_considered',
    ],
    ['lms.batch.transfer.rejected', 'rejected', 'batch_transfer_rejected'],
    ['lms.batch.transfer.completed', 'completed', 'batch_transfer_completed'],
  ])('%s → status %s / payload type %s', async (type, status, payloadType) => {
    await applyTransferEvent(FAKE_TX, transferEvent(type, 22), BATCH_USER)

    expect(applyBatchTransfer).toHaveBeenCalledWith(FAKE_TX, {
      batchUserId: 55,
      history: null,
      batchTransferId: 22,
      status,
      payloadType,
      payload: expect.objectContaining({ type }),
    })
  })

  it('rejects a transfer event without to_batch_id', async () => {
    await expect(
      applyTransferEvent(
        FAKE_TX,
        transferEvent('lms.batch.transfer.completed', null),
        BATCH_USER,
      ),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_ENROLMENT_PAYLOAD' })
    expect(applyBatchTransfer).not.toHaveBeenCalled()
  })
})
