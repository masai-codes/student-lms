import { describe, expect, it } from 'vitest'
import { parseLectureZoomChatResources } from '@/server/api/ai-tutor/services/parseLectureZoomChatResources'

describe('parseLectureZoomChatResources', () => {
  it('returns an empty list for null', () => {
    expect(parseLectureZoomChatResources(null)).toEqual([])
  })

  it('returns an empty list for invalid JSON strings', () => {
    expect(parseLectureZoomChatResources('{not-json')).toEqual([])
  })

  it('returns an empty list for non-array values', () => {
    expect(
      parseLectureZoomChatResources({ url: 'https://example.com' }),
    ).toEqual([])
    expect(parseLectureZoomChatResources('https://example.com')).toEqual([])
    expect(parseLectureZoomChatResources(42)).toEqual([])
  })

  it('skips non-object elements and entries without a url', () => {
    expect(
      parseLectureZoomChatResources([
        null,
        'link',
        12,
        { count: 1 },
        { url: '   ' },
        { url: 42 },
      ]),
    ).toEqual([])
  })

  it('parses valid resource objects and ignores malformed fields', () => {
    expect(
      parseLectureZoomChatResources([
        {
          url: 'https://colab.research.google.com/drive/1OwzXI9DYQIu-G7NFFIOoE0Hpne2h6ZhU?usp=sharing',
          count: 1,
          posted_by: 'Divyasri',
          timestamp: '00:51:47',
          resolved_to: null,
        },
        {
          url: 'https://example.com/guide',
          count: 'two',
          posted_by: '',
          timestamp: 123,
        },
      ]),
    ).toEqual([
      {
        url: 'https://colab.research.google.com/drive/1OwzXI9DYQIu-G7NFFIOoE0Hpne2h6ZhU?usp=sharing',
        count: 1,
        postedBy: 'Divyasri',
        timestamp: '00:51:47',
        resolvedTo: null,
      },
      {
        url: 'https://example.com/guide',
        count: null,
        postedBy: null,
        timestamp: null,
        resolvedTo: null,
      },
    ])
  })

  it('parses JSON strings that contain arrays', () => {
    expect(
      parseLectureZoomChatResources(
        JSON.stringify([{ url: 'https://example.com/resource', count: 2 }]),
      ),
    ).toEqual([
      {
        url: 'https://example.com/resource',
        count: 2,
        postedBy: null,
        timestamp: null,
        resolvedTo: null,
      },
    ])
  })
})
