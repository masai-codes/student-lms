import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleAdmissionEvent } from '@/server/api/webhooks/admissions/handlers/events.handler'

const processAdmissionEvent = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/events.service', () => ({
  processAdmissionEvent,
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'
const URL = 'http://localhost/api/webhooks/admissions/events'

// `null` omits the header (passing `undefined` would trigger the default).
function request(body: unknown, apiKey: string | null = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== null) headers.set('x-api-key', apiKey)
  return new Request(URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function paidEvent() {
  return { id: 1, type: 'lms.batch.paid', data: { enrolment_id: 123 } }
}

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  processAdmissionEvent.mockReset()
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('handleAdmissionEvent', () => {
  it('returns 200 with the service result and forwards the parsed envelope', async () => {
    processAdmissionEvent.mockResolvedValue({
      event: 'lms.batch.paid',
      batchUserId: 55,
    })
    const response = await handleAdmissionEvent(request(paidEvent()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      event: 'lms.batch.paid',
      batchUserId: 55,
    })
    expect(processAdmissionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lms.batch.paid' }),
    )
  })

  it('returns 401 when the api key is missing', async () => {
    const response = await handleAdmissionEvent(request(paidEvent(), null))
    expect(response.status).toBe(401)
    expect(processAdmissionEvent).not.toHaveBeenCalled()
  })

  it('returns 400 for an unknown event type', async () => {
    const response = await handleAdmissionEvent(
      request({ type: 'lms.batch.boom', data: { enrolment_id: 1 } }),
    )
    expect(response.status).toBe(400)
    expect(processAdmissionEvent).not.toHaveBeenCalled()
  })

  it('maps ENROLMENT_NOT_FOUND (404) to wire-status 422', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    processAdmissionEvent.mockRejectedValue(
      new ApiError(404, 'ENROLMENT_NOT_FOUND'),
    )
    const response = await handleAdmissionEvent(request(paidEvent()))
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'ENROLMENT_NOT_FOUND',
    })
  })
})
