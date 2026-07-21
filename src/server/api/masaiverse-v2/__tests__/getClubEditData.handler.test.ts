import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getClubEditData: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getClubEditData.service', () => ({
  getClubEditData: hoisted.getClubEditData,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function getRequest(clubId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/clubs/edit-data?clubId=${clubId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

describe('handleGetClubEditData', () => {
  it('returns the edit data for the session admin', async () => {
    const { handleGetClubEditData } =
      await import('../handlers/getClubEditData.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(9)
    hoisted.getClubEditData.mockResolvedValueOnce({
      id: '5',
      name: 'X',
      meta: {},
    })

    const response = await handleGetClubEditData(getRequest('5', 'session=abc'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: '5',
      name: 'X',
      meta: {},
    })
    expect(hoisted.getClubEditData).toHaveBeenCalledWith(9, 5)
  })

  it('returns 401 without a session', async () => {
    const { handleGetClubEditData } =
      await import('../handlers/getClubEditData.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )
    const response = await handleGetClubEditData(getRequest('5', null))
    expect(response.status).toBe(401)
    expect(hoisted.getClubEditData).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service', async () => {
    const { handleGetClubEditData } =
      await import('../handlers/getClubEditData.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(9)
    hoisted.getClubEditData.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )
    const response = await handleGetClubEditData(getRequest('5', 'session=abc'))
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
  })

  it('maps unexpected failures to a 500 error', async () => {
    const { handleGetClubEditData } =
      await import('../handlers/getClubEditData.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(9)
    hoisted.getClubEditData.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleGetClubEditData(getRequest('5', 'session=abc'))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_CLUB_EDIT_DATA',
    })
    consoleSpy.mockRestore()
  })
})
