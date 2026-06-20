import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  setPostBanned: vi.fn(),
  setReplyBanned: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/moderateDiscussion.service',
  () => ({
    setPostBanned: hoisted.setPostBanned,
    setReplyBanned: hoisted.setReplyBanned,
  }),
)
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

const cookie = { cookie: 'session=abc' }
const url = 'http://localhost/api/masaiverse-v2/discussions/ban'

function post(body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: cookie,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getUserIdFromCookieHeader.mockResolvedValue(5)
})

describe('handleModerateDiscussion', () => {
  it('bans a post', async () => {
    const { handleModerateDiscussion } =
      await import('../handlers/moderateDiscussion.handler')
    hoisted.setPostBanned.mockResolvedValueOnce({
      target: 'post',
      postId: '7',
      replyId: null,
      isBanned: true,
    })

    const res = await handleModerateDiscussion(
      post({ target: 'post', postId: '7', banned: true }),
    )
    expect(res.status).toBe(200)
    expect(hoisted.setPostBanned).toHaveBeenCalledWith(5, 7, true)
    expect(hoisted.setReplyBanned).not.toHaveBeenCalled()
  })

  it('bans a reply', async () => {
    const { handleModerateDiscussion } =
      await import('../handlers/moderateDiscussion.handler')
    hoisted.setReplyBanned.mockResolvedValueOnce({
      target: 'reply',
      postId: '7',
      replyId: '3',
      isBanned: true,
    })

    const res = await handleModerateDiscussion(
      post({ target: 'reply', postId: '7', replyId: '3', banned: true }),
    )
    expect(res.status).toBe(200)
    expect(hoisted.setReplyBanned).toHaveBeenCalledWith(5, 7, 3, true)
  })

  it('400s for an unknown target', async () => {
    const { handleModerateDiscussion } =
      await import('../handlers/moderateDiscussion.handler')
    const res = await handleModerateDiscussion(post({ target: 'nope' }))
    expect(res.status).toBe(400)
    expect(hoisted.setPostBanned).not.toHaveBeenCalled()
    expect(hoisted.setReplyBanned).not.toHaveBeenCalled()
  })

  it('maps a service ApiError to its status (403 for non-admins)', async () => {
    const { handleModerateDiscussion } =
      await import('../handlers/moderateDiscussion.handler')
    hoisted.setPostBanned.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const res = await handleModerateDiscussion(
      post({ target: 'post', postId: '7', banned: true }),
    )
    expect(res.status).toBe(403)
  })

  it('401s when not signed in', async () => {
    const { handleModerateDiscussion } =
      await import('../handlers/moderateDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handleModerateDiscussion(
      post({ target: 'post', postId: '7', banned: true }),
    )
    expect(res.status).toBe(401)
  })
})
