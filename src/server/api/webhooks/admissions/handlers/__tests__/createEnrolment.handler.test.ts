import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleCreateEnrolment } from '@/server/api/webhooks/admissions/handlers/createEnrolment.handler'

const createEnrolmentFromAdmissions = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/webhooks/admissions/createEnrolment.service', () => ({
  createEnrolmentFromAdmissions,
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const API_KEY = 'admissions-secret'

function request(body: unknown, apiKey: string | undefined = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== undefined) headers.set('x-api-key', apiKey)
  return new Request(
    'http://localhost/api/webhooks/admissions/create-enrolment',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  )
}

function validBody() {
  return {
    name: 'Asha Rao',
    email: 'asha@example.com',
    password: 'secret',
    mobile: '9998887776',
    username: 'asha',
    section_ids: [1],
    batch_id: 10,
  }
}

beforeEach(() => {
  process.env.ADMISSIONS_API_KEY = API_KEY
  createEnrolmentFromAdmissions.mockReset()
})

afterEach(() => {
  delete process.env.ADMISSIONS_API_KEY
})

describe('handleCreateEnrolment', () => {
  it('returns 200 with the service result on a valid request', async () => {
    createEnrolmentFromAdmissions.mockResolvedValue({
      batchUserId: 55,
      invalidSectionIds: [{ sectionId: 9, reason: 'NOT_FOUND' }],
    })

    const response = await handleCreateEnrolment(request(validBody()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      batchUserId: 55,
      invalidSectionIds: [{ sectionId: 9, reason: 'NOT_FOUND' }],
    })
    expect(createEnrolmentFromAdmissions).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when the api key is wrong', async () => {
    const response = await handleCreateEnrolment(request(validBody(), 'wrong'))

    expect(response.status).toBe(401)
    expect(createEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleCreateEnrolment(request({ email: 'bad' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_ENROLMENT_PAYLOAD',
    })
    expect(createEnrolmentFromAdmissions).not.toHaveBeenCalled()
  })

  it('maps a thrown ApiError from the service to its status', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    createEnrolmentFromAdmissions.mockRejectedValue(
      new ApiError(404, 'BATCH_NOT_FOUND'),
    )

    const response = await handleCreateEnrolment(request(validBody()))

    // 404 is remapped to wire-status 422 with the true status in a header so the
    // JSON body survives CloudFront (see cloudFrontSafeResponseInit).
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'BATCH_NOT_FOUND',
    })
  })
})
