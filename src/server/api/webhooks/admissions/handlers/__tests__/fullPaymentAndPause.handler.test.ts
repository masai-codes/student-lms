import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleFullPaymentReceived } from '@/server/api/webhooks/admissions/handlers/fullPaymentReceived.handler'
import { handlePauseBatch } from '@/server/api/webhooks/admissions/handlers/pauseBatch.handler'

const recordFullPaymentReceived = vi.hoisted(() => vi.fn())
const pauseBatchEnrolment = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/fullPaymentReceived.service', () => ({
  recordFullPaymentReceived,
}))
vi.mock('@/server/api/webhooks/admissions/pauseBatch.service', () => ({
  pauseBatchEnrolment,
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'

// `null` omits the header entirely (passing `undefined` would trigger the default).
function request(
  url: string,
  body: unknown,
  apiKey: string | null = API_KEY,
): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== null) headers.set('x-api-key', apiKey)
  return new Request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  recordFullPaymentReceived.mockReset()
  pauseBatchEnrolment.mockReset()
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('handleFullPaymentReceived', () => {
  const url =
    'http://localhost/api/webhooks/admissions/batch-full-payment-received'

  it('returns 200 with the service result', async () => {
    recordFullPaymentReceived.mockResolvedValue({
      batchUserId: 55,
      fullFeesPaid: true,
    })
    const response = await handleFullPaymentReceived(
      request(url, { enrolment_id: 999, full_fees_paid: true }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      batchUserId: 55,
      fullFeesPaid: true,
    })
  })

  it('maps ADMISSION_DATA_NOT_FOUND (404) to wire-status 422', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    recordFullPaymentReceived.mockRejectedValue(
      new ApiError(404, 'ADMISSION_DATA_NOT_FOUND'),
    )
    const response = await handleFullPaymentReceived(
      request(url, { enrolment_id: 999, full_fees_paid: true }),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'ADMISSION_DATA_NOT_FOUND',
    })
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleFullPaymentReceived(
      request(url, { enrolment_id: 999 }),
    )
    expect(response.status).toBe(400)
    expect(recordFullPaymentReceived).not.toHaveBeenCalled()
  })
})

describe('handlePauseBatch', () => {
  const url = 'http://localhost/api/webhooks/admissions/pause-batch'

  it('returns 200 with the service result', async () => {
    pauseBatchEnrolment.mockResolvedValue({
      batchUserId: 55,
      batchPausedDate: '2026-07-24T10:00:00.000Z',
    })
    const response = await handlePauseBatch(request(url, { enrolment_id: 999 }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      batchUserId: 55,
      batchPausedDate: '2026-07-24T10:00:00.000Z',
    })
  })

  it('returns 401 when the api key is missing', async () => {
    const response = await handlePauseBatch(
      request(url, { enrolment_id: 999 }, null),
    )
    expect(response.status).toBe(401)
    expect(pauseBatchEnrolment).not.toHaveBeenCalled()
  })
})
