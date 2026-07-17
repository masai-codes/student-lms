import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('markSubmissionCompletedWithToken (client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs the token to the mark-completed endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ markAsCompleted: true })
    const { markSubmissionCompletedWithToken } =
      await import('../assignmentDetailActionsApi')

    const result = await markSubmissionCompletedWithToken(79307, 'abc123')

    expect(result).toEqual({ markAsCompleted: true })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/assignments/79307/mark-completed-with-token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'abc123' }),
      }),
    )
  })

  it('maps an API client error to a plain Error', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(
      new ApiClientError(403, {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      }),
    )
    const { markSubmissionCompletedWithToken } =
      await import('../assignmentDetailActionsApi')

    await expect(
      markSubmissionCompletedWithToken(79307, 'bad'),
    ).rejects.toThrow('Invalid token')
  })

  it('rethrows unexpected (non-API) errors', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(new Error('network down'))
    const { markSubmissionCompletedWithToken } =
      await import('../assignmentDetailActionsApi')

    await expect(
      markSubmissionCompletedWithToken(79307, 'abc123'),
    ).rejects.toThrow('network down')
  })
})
