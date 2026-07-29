import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleCancelEnrolment } from '@/server/api/webhooks/admissions/handlers/cancelEnrolment.handler'

const cancelEnrolmentFromAdmissions = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/cancelEnrolment.service', () => ({
  cancelEnrolmentFromAdmissions,
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'

function request(body: unknown, apiKey: string | undefined = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== undefined) headers.set('x-api-key', apiKey)
  return new Request(
    'http://localhost/api/webhooks/admissions/cancel-enrolment',
    { method: 'POST', headers, body: JSON.stringify(body) },
  )
}

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  cancelEnrolmentFromAdmissions.mockReset()
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('handleCancelEnrolment', () => {
  it('returns 200 with the service result on a valid request', async () => {
    cancelEnrolmentFromAdmissions.mockResolvedValue({
      batchUserId: 55,
      userId: 7,
      batchId: 10,
      cancelledSectionUserIds: [1, 2],
    })

    const response = await handleCancelEnrolment(request({ enrolment_id: 999 }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      batchUserId: 55,
      userId: 7,
      batchId: 10,
      cancelledSectionUserIds: [1, 2],
    })
    expect(cancelEnrolmentFromAdmissions).toHaveBeenCalledWith({
      enrolment_id: 999,
    })
  })

  it('returns 401 when the api key is wrong', async () => {
    const response = await handleCancelEnrolment(
      request({ enrolment_id: 999 }, 'wrong'),
    )

    expect(response.status).toBe(401)
    expect(cancelEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleCancelEnrolment(request({}))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_ENROLMENT_PAYLOAD',
    })
    expect(cancelEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('maps ENROLMENT_NOT_FOUND (404) to wire-status 422 with a true-status header', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    cancelEnrolmentFromAdmissions.mockRejectedValue(
      new ApiError(404, 'ENROLMENT_NOT_FOUND'),
    )

    const response = await handleCancelEnrolment(request({ enrolment_id: 999 }))

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'ENROLMENT_NOT_FOUND',
    })
  })
})
