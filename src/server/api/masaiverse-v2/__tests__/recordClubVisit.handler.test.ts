import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  recordClubVisit: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/recordClubVisit.service', () => ({
  recordClubVisit: hoisted.recordClubVisit,
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/clubs/visit', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('handleRecordClubVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockReset()
  })

  it('records the visit for the session user and returns the result', async () => {
    const { handleRecordClubVisit } =
      await import('../handlers/recordClubVisit.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(99)
    hoisted.recordClubVisit.mockResolvedValueOnce(true)

    const response = await handleRecordClubVisit(
      postRequest({ clubId: 5 }, 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ recorded: true })
    expect(hoisted.recordClubVisit).toHaveBeenCalledWith(99, 5)
  })

  it('passes NaN to the service when the body is missing', async () => {
    const { handleRecordClubVisit } =
      await import('../handlers/recordClubVisit.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(3)
    hoisted.recordClubVisit.mockResolvedValueOnce(false)

    const response = await handleRecordClubVisit(
      postRequest(undefined, 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ recorded: false })
    expect(hoisted.recordClubVisit).toHaveBeenCalledWith(3, Number.NaN)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleRecordClubVisit } =
      await import('../handlers/recordClubVisit.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleRecordClubVisit(
      postRequest({ clubId: 5 }, null),
    )

    expect(response.status).toBe(401)
    expect(hoisted.recordClubVisit).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleRecordClubVisit } =
      await import('../handlers/recordClubVisit.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(5)
    hoisted.recordClubVisit.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleRecordClubVisit(
      postRequest({ clubId: 5 }, 'session=abc'),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_RECORDING_CLUB_VISIT',
      message: 'SERVER_ERROR_RECORDING_CLUB_VISIT',
    })
    consoleSpy.mockRestore()
  })
})
