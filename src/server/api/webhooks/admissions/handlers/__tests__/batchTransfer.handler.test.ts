import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  handleBatchTransferCompleted,
  handleBatchTransferConsidered,
  handleBatchTransferRejected,
} from '@/server/api/webhooks/admissions/handlers/batchTransfer.handler'

const recordBatchTransfer = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/recordBatchTransfer.service', () => ({
  recordBatchTransfer,
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'

function request(body: unknown, apiKey: string | undefined = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== undefined) headers.set('x-api-key', apiKey)
  return new Request(
    'http://localhost/api/webhooks/admissions/batch-transfer',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  )
}

const VALID = { enrolment_id: 999, batch_transfer_id: 12345 }

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  recordBatchTransfer.mockReset()
  recordBatchTransfer.mockResolvedValue({
    batchUserId: 55,
    batchTransferId: 12345,
    batchTransferStatus: 'considered',
  })
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('batch-transfer handlers', () => {
  it('considered handler passes the considered status + payload type', async () => {
    const response = await handleBatchTransferConsidered(request(VALID))

    expect(response.status).toBe(200)
    expect(recordBatchTransfer).toHaveBeenCalledWith(VALID, {
      status: 'considered',
      payloadType: 'batch_transfer_considered',
    })
  })

  it('rejected handler passes the rejected status + payload type', async () => {
    await handleBatchTransferRejected(request(VALID))
    expect(recordBatchTransfer).toHaveBeenCalledWith(VALID, {
      status: 'rejected',
      payloadType: 'batch_transfer_rejected',
    })
  })

  it('completed handler passes the completed status + payload type', async () => {
    await handleBatchTransferCompleted(request(VALID))
    expect(recordBatchTransfer).toHaveBeenCalledWith(VALID, {
      status: 'completed',
      payloadType: 'batch_transfer_completed',
    })
  })

  it('returns 401 when the api key is wrong', async () => {
    const response = await handleBatchTransferConsidered(request(VALID, 'nope'))
    expect(response.status).toBe(401)
    expect(recordBatchTransfer).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleBatchTransferConsidered(
      request({ enrolment_id: 999 }),
    )
    expect(response.status).toBe(400)
    expect(recordBatchTransfer).not.toHaveBeenCalled()
  })
})
