import { describe, expect, it } from 'vitest'
import { formatLectureSharedResourcesForPrompt } from '@/server/api/ai-tutor/services/formatLectureSharedResources'

describe('formatLectureSharedResourcesForPrompt', () => {
  it('returns the empty-state message when no resources exist', () => {
    expect(formatLectureSharedResourcesForPrompt([])).toBe(
      'No resources were shared during the lecture.',
    )
  })

  it('formats resource metadata for the system prompt', () => {
    expect(
      formatLectureSharedResourcesForPrompt([
        {
          url: 'https://example.com/resource',
          count: 1,
          postedBy: 'Divyasri',
          timestamp: '00:51:47',
          resolvedTo: 'https://example.com/final',
        },
      ]),
    ).toBe(
      '- https://example.com/resource (at 00:51:47, by Divyasri, shared 1 time(s), resolved to https://example.com/final)',
    )
  })

  it('formats resources with only a url when metadata is missing', () => {
    expect(
      formatLectureSharedResourcesForPrompt([
        {
          url: 'https://example.com/resource',
          count: null,
          postedBy: null,
          timestamp: null,
          resolvedTo: null,
        },
      ]),
    ).toBe('- https://example.com/resource')
  })
})
