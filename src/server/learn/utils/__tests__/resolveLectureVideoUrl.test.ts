import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveLectureVideoUrl } from '../resolveLectureVideoUrl'

describe('resolveLectureVideoUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers gumlet hls url', () => {
    expect(
      resolveLectureVideoUrl({
        videos: ['https://example.com/a.mp4'],
        vimeoDownloadLinks: {
          gumlet: { hls_url: 'https://cdn.example/hls.m3u8' },
        },
        vimeoPlayerEmbedUrl: 'https://player.vimeo.com/x',
      }),
    ).toBe('https://cdn.example/hls.m3u8')
  })

  it('falls back to videos and embed url when no gumlet', () => {
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

  describe('CloudFront rewrite (S3 videos)', () => {
    it('rewrites zoom-lecture-recordings bucket to /zoom CDN origin', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        resolveLectureVideoUrl({
          videos: [
            'https://zoom-lecture-recordings.s3.ap-south-1.amazonaws.com/83318450964/segment',
          ],
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe('https://dxyz.cloudfront.net/zoom/83318450964/segment')
    })

    it('rewrites masai-course bucket to /masai-course CDN origin', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        resolveLectureVideoUrl({
          videos: [
            'https://masai-course.s3.ap-south-1.amazonaws.com/videos/a.mp4',
          ],
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe('https://dxyz.cloudfront.net/masai-course/videos/a.mp4')
    })

    it('returns the raw S3 url when CLOUD_FRONT_BASE is not configured', () => {
      // No env stub → CLOUD_FRONT_BASE is undefined
      const raw =
        'https://zoom-lecture-recordings.s3.ap-south-1.amazonaws.com/83318450964/segment'
      expect(
        resolveLectureVideoUrl({
          videos: [raw],
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe(raw)
    })

    it('does not rewrite gumlet HLS urls', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        resolveLectureVideoUrl({
          videos: null,
          vimeoDownloadLinks: {
            gumlet: { hls_url: 'https://cdn.masaischool.com/hls/master.m3u8' },
          },
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe('https://cdn.masaischool.com/hls/master.m3u8')
    })
  })
})
