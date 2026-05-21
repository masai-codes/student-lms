import { describe, expect, it } from 'vitest'

import { resolveLectureVideoUrl } from '../resolveLectureVideoUrl'

describe('resolveLectureVideoUrl', () => {
  it('prefers gumlet hls url', () => {
    expect(
      resolveLectureVideoUrl({
        videos: ['https://example.com/a.mp4'],
        vimeoDownloadLinks: { gumlet: { hls_url: 'https://cdn.example/hls.m3u8' } },
        vimeoPlayerEmbedUrl: 'https://player.vimeo.com/x',
      }),
    ).toBe('https://cdn.example/hls.m3u8')
  })

  it('falls back to videos and embed url', () => {
    expect(
      resolveLectureVideoUrl({
        videos: ['https://example.com/a.mp4'],
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
      }),
    ).toBe('https://example.com/a.mp4')

    expect(
      resolveLectureVideoUrl({
        videos: null,
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: 'https://player.vimeo.com/x',
      }),
    ).toBe('https://player.vimeo.com/x')
  })

  it('returns null when no sources exist', () => {
    expect(
      resolveLectureVideoUrl({
        videos: [],
        vimeoDownloadLinks: {},
        vimeoPlayerEmbedUrl: '   ',
      }),
    ).toBeNull()
  })
})
