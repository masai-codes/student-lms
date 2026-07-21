import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkIfValidQuery } from '../checkIfValidQuery'

describe('checkIfValidQuery', () => {
  const originalKey = process.env.OPENAI_API_KEY

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = originalKey
    }
  })

  function mockOpenAiResponse(content: string | null, ok = true) {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      json: async () => ({
        choices: [{ message: { content } }],
      }),
    } as Response)
  }

  it('returns false when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns true when classifier says CURRICULUM_RELATED', async () => {
    mockOpenAiResponse(JSON.stringify({ classification: 'CURRICULUM_RELATED' }))
    await expect(
      checkIfValidQuery('How do I solve this React useEffect bug?'),
    ).resolves.toBe(true)
  })

  it('returns false when classifier says NON_CURRICULUM', async () => {
    mockOpenAiResponse(JSON.stringify({ classification: 'NON_CURRICULUM' }))
    await expect(checkIfValidQuery('which phone should I buy?')).resolves.toBe(
      false,
    )
  })

  it('returns false for unknown classification values', async () => {
    mockOpenAiResponse(JSON.stringify({ classification: 'curriculum_related' }))
    await expect(checkIfValidQuery('lowercase response')).resolves.toBe(false)
  })

  it('returns false when content is empty', async () => {
    mockOpenAiResponse(null)
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('returns false when JSON is malformed', async () => {
    mockOpenAiResponse('not json')
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('returns false when the API response is not ok', async () => {
    mockOpenAiResponse(null, false)
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('returns false when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('uses gpt-4.1-mini with json_object response_format', async () => {
    mockOpenAiResponse(JSON.stringify({ classification: 'NON_CURRICULUM' }))
    await checkIfValidQuery('hello')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('gpt-4.1-mini'),
      }),
    )
    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String(call?.[1]?.body)) as {
      model: string
      response_format: { type: string }
    }
    expect(body.model).toBe('gpt-4.1-mini')
    expect(body.response_format).toEqual({ type: 'json_object' })
  })
})
