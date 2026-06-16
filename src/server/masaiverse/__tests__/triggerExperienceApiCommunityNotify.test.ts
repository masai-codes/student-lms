import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

function lastFetchBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit]
  return JSON.parse(String(init.body))
}

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.EXPERIENCE_API_BASE_URL = 'http://localhost:4000/'
  process.env.COMMUNITY_MASAIVERSE_INTERNAL_SECRET = 'sekret'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('notifyDiscussionReplyViaExperienceApi', () => {
  it('skips the call when base url or secret is missing', async () => {
    delete process.env.EXPERIENCE_API_BASE_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { notifyDiscussionReplyViaExperienceApi } = await import(
      '../triggerExperienceApiCommunityNotify'
    )
    await notifyDiscussionReplyViaExperienceApi({
      postId: 7,
      recipientUserId: 9,
      actorUserId: 1,
      replyPreview: 'Hi',
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })

  it('posts to the trimmed base url with club_id and the default type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { notifyDiscussionReplyViaExperienceApi } = await import(
      '../triggerExperienceApiCommunityNotify'
    )
    await notifyDiscussionReplyViaExperienceApi({
      postId: 7,
      recipientUserId: 9,
      actorUserId: 1,
      replyPreview: 'Hi',
      clubId: 4,
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:4000/internal/community-masaiverse/notify/post-reply')
    expect((init.headers as Record<string, string>)['x-community-masaiverse-secret']).toBe('sekret')
    expect(lastFetchBody(fetchMock)).toEqual({
      post_id: 7,
      recipient_user_id: 9,
      actor_user_id: 1,
      reply_preview: 'Hi',
      notification_type: 'discussion-reply-received',
      club_id: 4,
    })
  })

  it('omits club_id for public posts and honors an explicit notificationType', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { notifyDiscussionReplyViaExperienceApi } = await import(
      '../triggerExperienceApiCommunityNotify'
    )
    await notifyDiscussionReplyViaExperienceApi({
      postId: 7,
      recipientUserId: 9,
      actorUserId: 1,
      replyPreview: 'Hi',
      clubId: null,
      notificationType: 'custom-type',
    })

    const body = lastFetchBody(fetchMock)
    expect(body).not.toHaveProperty('club_id')
    expect(body.notification_type).toBe('custom-type')
  })

  it('warns but does not throw on a non-ok response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('boom') })
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { notifyDiscussionReplyViaExperienceApi } = await import(
      '../triggerExperienceApiCommunityNotify'
    )
    await expect(
      notifyDiscussionReplyViaExperienceApi({
        postId: 7,
        recipientUserId: 9,
        actorUserId: 1,
        replyPreview: 'Hi',
      }),
    ).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('[communityMasaiverse] reply notify HTTP', 500, 'boom')
  })

  it('swallows transport errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { notifyDiscussionReplyViaExperienceApi } = await import(
      '../triggerExperienceApiCommunityNotify'
    )
    await expect(
      notifyDiscussionReplyViaExperienceApi({
        postId: 7,
        recipientUserId: 9,
        actorUserId: 1,
        replyPreview: 'Hi',
      }),
    ).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })
})
