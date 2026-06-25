import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('discussionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLearnDiscussionViaApi', () => {
    it('POSTs to the discussions endpoint and returns the new id', async () => {
      hoisted.fetchJson.mockResolvedValueOnce({ discussionId: 42 })
      const { createLearnDiscussionViaApi } = await import('../discussionsApi')

      const result = await createLearnDiscussionViaApi({
        kind: 'lecture',
        entityId: 572,
        title: 'Need help',
        message: 'How?',
      })

      expect(result).toEqual({ discussionId: 42 })
      expect(hoisted.fetchJson).toHaveBeenCalledWith(
        '/api/learn/discussions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            kind: 'lecture',
            entityId: 572,
            title: 'Need help',
            message: 'How?',
          }),
        }),
      )
    })

    it('maps an API client error to a code-only Error', async () => {
      hoisted.fetchJson.mockRejectedValueOnce(
        new ApiClientError(403, { code: 'DISCUSSION_FORBIDDEN' }),
      )
      const { createLearnDiscussionViaApi } = await import('../discussionsApi')

      await expect(
        createLearnDiscussionViaApi({
          kind: 'lecture',
          entityId: 1,
          title: 't',
          message: 'm',
        }),
      ).rejects.toThrow('DISCUSSION_FORBIDDEN')
    })
  })

  describe('addLearnDiscussionReplyViaApi', () => {
    it('POSTs the message to the replies endpoint', async () => {
      hoisted.fetchJson.mockResolvedValueOnce({ ok: true })
      const { addLearnDiscussionReplyViaApi } = await import('../discussionsApi')

      const result = await addLearnDiscussionReplyViaApi({
        discussionId: 12,
        message: 'Thanks!',
      })

      expect(result).toEqual({ ok: true })
      expect(hoisted.fetchJson).toHaveBeenCalledWith(
        '/api/learn/discussions/12/replies',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Thanks!' }),
        }),
      )
    })

    it('rethrows unexpected (non-API) errors', async () => {
      hoisted.fetchJson.mockRejectedValueOnce(new Error('boom'))
      const { addLearnDiscussionReplyViaApi } = await import('../discussionsApi')

      await expect(
        addLearnDiscussionReplyViaApi({ discussionId: 12, message: 'hi' }),
      ).rejects.toThrow('boom')
    })
  })
})
