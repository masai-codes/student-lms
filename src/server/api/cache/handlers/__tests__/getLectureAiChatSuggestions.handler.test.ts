import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleGetCachedLectureAiChatSuggestions } from '../getLectureAiChatSuggestions.handler'
import { getLectureAiChatSuggestions } from '@/server/api/ai-tutor/services/getLectureAiChatSuggestions.service'

vi.mock(
  '@/server/api/ai-tutor/services/getLectureAiChatSuggestions.service',
  () => ({
    getLectureAiChatSuggestions: vi.fn(),
  }),
)

describe('getLectureAiChatSuggestions.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves the suggestions with an edge-cacheable Cache-Control header, without a session check', async () => {
    vi.mocked(getLectureAiChatSuggestions).mockResolvedValue([
      { icon: 'faq', question: 'What is X?' },
      { icon: 'summary', question: 'Summarize the key points of this lecture' },
    ])

    const res = await handleGetCachedLectureAiChatSuggestions('12')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=300, s-maxage=300',
    )
    await expect(res.json()).resolves.toEqual({
      suggestions: [
        { icon: 'faq', question: 'What is X?' },
        {
          icon: 'summary',
          question: 'Summarize the key points of this lecture',
        },
      ],
    })
    expect(getLectureAiChatSuggestions).toHaveBeenCalledWith(12)
  })

  it('rejects an invalid lectureId without hitting the service', async () => {
    const res = await handleGetCachedLectureAiChatSuggestions('0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(getLectureAiChatSuggestions).not.toHaveBeenCalled()
  })

  it('never caches an unexpected error at the edge', async () => {
    vi.mocked(getLectureAiChatSuggestions).mockRejectedValue(new Error('boom'))

    const res = await handleGetCachedLectureAiChatSuggestions('12')

    expect(res.status).toBe(500)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
