import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  createDiscussion: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/createCommunityDiscussion.service',
  () => ({
    createCommunityDiscussion: hoisted.createDiscussion,
  }),
)
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(
  body: unknown,
  cookie: string | null = 'session=abc',
): Request {
  return new Request('http://localhost/api/masaiverse-v2/discussions', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleCreateCommunityDiscussion', () => {
  it('creates the discussion and returns 201 with the id', async () => {
    const { handleCreateCommunityDiscussion } =
      await import('../handlers/createCommunityDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(5)
    hoisted.createDiscussion.mockResolvedValueOnce({ id: '99' })

    const res = await handleCreateCommunityDiscussion(
      postRequest({
        title: 'Hi',
        content: '<p>Yo</p>',
        tags: ['Career', 42, 'Interviews'],
      }),
    )

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({ id: '99' })
    // Non-string tags are filtered out; no clubId means a community post.
    expect(hoisted.createDiscussion).toHaveBeenCalledWith(5, {
      title: 'Hi',
      content: '<p>Yo</p>',
      tags: ['Career', 'Interviews'],
      clubId: null,
    })
  })

  it('forwards a string clubId so the post is scoped to that club', async () => {
    const { handleCreateCommunityDiscussion } =
      await import('../handlers/createCommunityDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(5)
    hoisted.createDiscussion.mockResolvedValueOnce({ id: '99' })

    const res = await handleCreateCommunityDiscussion(
      postRequest({
        title: 'Hi',
        content: '<p>Yo</p>',
        tags: [],
        clubId: '81910',
      }),
    )

    expect(res.status).toBe(201)
    expect(hoisted.createDiscussion).toHaveBeenCalledWith(5, {
      title: 'Hi',
      content: '<p>Yo</p>',
      tags: [],
      clubId: '81910',
    })
  })

  it('returns 401 when not signed in', async () => {
    const { handleCreateCommunityDiscussion } =
      await import('../handlers/createCommunityDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handleCreateCommunityDiscussion(
      postRequest({ title: 'Hi', content: '<p>Yo</p>' }, null),
    )
    expect(res.status).toBe(401)
    expect(hoisted.createDiscussion).not.toHaveBeenCalled()
  })

  it('maps a validation ApiError to its status', async () => {
    const { handleCreateCommunityDiscussion } =
      await import('../handlers/createCommunityDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(5)
    hoisted.createDiscussion.mockRejectedValueOnce(
      new ApiError(400, 'DISCUSSION_TITLE_REQUIRED'),
    )

    const res = await handleCreateCommunityDiscussion(
      postRequest({ content: 'x' }),
    )
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'DISCUSSION_TITLE_REQUIRED',
      message: 'DISCUSSION_TITLE_REQUIRED',
    })
  })

  it('maps an unexpected failure to a 500', async () => {
    const { handleCreateCommunityDiscussion } =
      await import('../handlers/createCommunityDiscussion.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(5)
    hoisted.createDiscussion.mockRejectedValueOnce(new Error('db down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await handleCreateCommunityDiscussion(
      postRequest({ title: 'Hi', content: '<p>Yo</p>' }),
    )
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({
      code: 'SERVER_ERROR_CREATING_DISCUSSION',
      message: 'SERVER_ERROR_CREATING_DISCUSSION',
    })
    spy.mockRestore()
  })
})
