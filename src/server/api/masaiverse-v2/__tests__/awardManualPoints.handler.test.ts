import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  awardManualPoints: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/awardManualPoints.service',
  () => ({
    awardManualPoints: hoisted.awardManualPoints,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/award-points', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

async function load() {
  return (await import('../handlers/awardManualPoints.handler'))
    .handleAwardManualPoints
}

describe('handleAwardManualPoints', () => {
  it('awards points (201) parsing the numeric args and club id', async () => {
    const handle = await load()
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.awardManualPoints.mockResolvedValueOnce({ id: '99' })

    const response = await handle(
      postRequest(
        { targetUserId: '2', points: '50', clubId: '9' },
        'session=abc',
      ),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: '99' })
    expect(hoisted.awardManualPoints).toHaveBeenCalledWith(7, {
      targetUserId: 2,
      points: 50,
      clubId: 9,
    })
  })

  it('treats a blank/missing club id as a community-wide award', async () => {
    const handle = await load()
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.awardManualPoints.mockResolvedValueOnce({ id: '1' })

    await handle(
      postRequest(
        { targetUserId: '2', points: '5', clubId: '' },
        'session=abc',
      ),
    )
    expect(hoisted.awardManualPoints).toHaveBeenCalledWith(7, {
      targetUserId: 2,
      points: 5,
      clubId: null,
    })
  })

  it('returns 401 when there is no session', async () => {
    const handle = await load()
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handle(
      postRequest({ targetUserId: '2', points: 5 }, null),
    )
    expect(response.status).toBe(401)
    expect(hoisted.awardManualPoints).not.toHaveBeenCalled()
  })

  it('propagates a service ApiError (e.g. 403)', async () => {
    const handle = await load()
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.awardManualPoints.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handle(
      postRequest({ targetUserId: '2', points: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
  })

  it('maps an unexpected error to 500', async () => {
    const handle = await load()
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.awardManualPoints.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handle(
      postRequest({ targetUserId: '2', points: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_AWARDING_POINTS',
    })
    errorSpy.mockRestore()
  })
})
