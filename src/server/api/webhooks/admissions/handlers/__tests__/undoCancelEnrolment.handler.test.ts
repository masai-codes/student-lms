import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleUndoCancelEnrolment } from '@/server/api/webhooks/admissions/handlers/undoCancelEnrolment.handler'

const undoCancelEnrolmentFromAdmissions = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/undoCancelEnrolment.service', () => ({
  undoCancelEnrolmentFromAdmissions,
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'
const RESULT = {
  batchUserId: 55,
  userId: 7,
  batchId: 10,
  revivedSectionUserIds: [1, 2],
  alreadyActive: false,
}

function request(body: unknown, apiKey: string | undefined = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== undefined) headers.set('x-api-key', apiKey)
  return new Request(
    'http://localhost/api/webhooks/admissions/undo-cancel-enrolment',
    { method: 'POST', headers, body: JSON.stringify(body) },
  )
}

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  undoCancelEnrolmentFromAdmissions.mockReset()
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('handleUndoCancelEnrolment', () => {
  it('returns 200 with the service result on a valid request', async () => {
    undoCancelEnrolmentFromAdmissions.mockResolvedValue(RESULT)

    const response = await handleUndoCancelEnrolment(
      request({ enrolment_id: 999, batch_id: 10 }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(RESULT)
    expect(undoCancelEnrolmentFromAdmissions).toHaveBeenCalledWith({
      enrolment_id: 999,
      batch_id: 10,
    })
  })

  it('returns 401 when the api key is wrong', async () => {
    const response = await handleUndoCancelEnrolment(
      request({ enrolment_id: 999 }, 'wrong'),
    )

    expect(response.status).toBe(401)
    expect(undoCancelEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleUndoCancelEnrolment(request({}))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_ENROLMENT_PAYLOAD',
    })
    expect(undoCancelEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('maps ENROLMENT_NOT_FOUND (404) to wire-status 422 with a true-status header', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    undoCancelEnrolmentFromAdmissions.mockRejectedValue(
      new ApiError(404, 'ENROLMENT_NOT_FOUND'),
    )

    const response = await handleUndoCancelEnrolment(
      request({ enrolment_id: 999 }),
    )

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'ENROLMENT_NOT_FOUND',
    })
  })
})
