import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  requireSessionUserId: vi.fn(),
  getMyCourses: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: hoisted.requireSessionUserId,
}))
vi.mock('@/server/api/courses/getMyCourses.service', () => ({
  getMyCourses: hoisted.getMyCourses,
}))

async function invoke() {
  const { handleGetMyCourses } = await import('../handlers/getMyCourses.handler')
  return handleGetMyCourses()
}

describe('handleGetMyCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns the listing for the session user', async () => {
    hoisted.requireSessionUserId.mockResolvedValue(7)
    const data = { active: [{ batchId: 10 }], cancelled: [] }
    hoisted.getMyCourses.mockResolvedValue(data)

    const response = await invoke()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(data)
    expect(hoisted.getMyCourses).toHaveBeenCalledWith(7)
  })

  it('propagates the 401 when there is no session', async () => {
    hoisted.requireSessionUserId.mockRejectedValue(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await invoke()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(hoisted.getMyCourses).not.toHaveBeenCalled()
  })

  it('maps an unexpected service failure to a 500', async () => {
    hoisted.requireSessionUserId.mockResolvedValue(7)
    hoisted.getMyCourses.mockRejectedValue(new Error('connection lost'))

    const response = await invoke()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_MY_COURSES',
    })
  })
})
