import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requestOpenRouterReportJson,
  requestOpenRouterText,
} from '../openRouterTextChat'

describe('openRouterTextChat', () => {
  const originalKey = process.env.OPENROUTER_API_KEY

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = originalKey
  })

  function mockOpenRouter(content: string | null, ok = true) {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    } as Response)
  }

  describe('requestOpenRouterText', () => {
    it('returns the trimmed text and sends no response_format', async () => {
      mockOpenRouter('  What is a hash map?  ')
      await expect(
        requestOpenRouterText({
          model: 'test/model',
          prompt: 'Ask a question',
        }),
      ).resolves.toBe('What is a hash map?')

      const call = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(String((call[1] as RequestInit).body)) as {
        response_format?: unknown
        messages: Array<unknown>
      }
      expect(body.response_format).toBeUndefined()
      expect(body.messages).toEqual([
        { role: 'user', content: 'Ask a question' },
      ])
    })

    it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
      delete process.env.OPENROUTER_API_KEY
      await expect(
        requestOpenRouterText({ model: 'test/model', prompt: 'x' }),
      ).rejects.toThrow('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    })
  })

  describe('requestOpenRouterReportJson', () => {
    it('parses valid JSON content', async () => {
      mockOpenRouter(JSON.stringify({ overallScore: 90 }))
      await expect(
        requestOpenRouterReportJson({
          model: 'test/model',
          prompt: 'score it',
        }),
      ).resolves.toEqual({ overallScore: 90 })
    })

    it('sends a json_schema response_format', async () => {
      mockOpenRouter(JSON.stringify({ overallScore: 90 }))
      await requestOpenRouterReportJson({
        model: 'test/model',
        prompt: 'score it',
      })

      const call = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(String((call[1] as RequestInit).body)) as {
        response_format?: { type: string }
      }
      expect(body.response_format?.type).toBe('json_schema')
    })

    it('throws INTERVIEW_OPENROUTER_INVALID_RESPONSE for non-JSON content', async () => {
      mockOpenRouter('not json')
      await expect(
        requestOpenRouterReportJson({
          model: 'test/model',
          prompt: 'score it',
        }),
      ).rejects.toThrow('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
    })
  })
})
