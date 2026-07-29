import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readLectureVideosMp4Url,
  readLectureVideosRecordingUrl,
  resolveLectureVideoUrl,
} from '../resolveLectureVideoUrl'

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

  describe('readLectureVideosRecordingUrl', () => {
    it('returns HLS urls from videos when gumlet is absent', () => {
      expect(
        readLectureVideosRecordingUrl([
          'https://cdn.example.com/hls-videos/abc/master.m3u8',
        ]),
      ).toBe('https://cdn.example.com/hls-videos/abc/master.m3u8')
    })

    it('rewrites non-mp4 S3 zoom segments through CloudFront', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        readLectureVideosRecordingUrl([
          'https://zoom-lecture-recordings.s3.ap-south-1.amazonaws.com/84313531944/link_02_1750917137000',
        ]),
      ).toBe(
        'https://dxyz.cloudfront.net/zoom/84313531944/link_02_1750917137000',
      )
    })
  })

  describe('readLectureVideosMp4Url', () => {
    it('returns the first mp4 url from videos', () => {
      expect(
        readLectureVideosMp4Url([
          'https://example.com/segment',
          'https://example.com/a.mp4',
        ]),
      ).toBe('https://example.com/a.mp4')
    })

    it('returns null when videos has no mp4 url', () => {
      expect(
        readLectureVideosMp4Url(['https://example.com/segment']),
      ).toBeNull()
    })
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

    it('percent-encodes S3 keys with spaces/special chars (old LMS parity)', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        resolveLectureVideoUrl({
          videos: [
            'https://zoom-lecture-recordings.s3.ap-south-1.amazonaws.com/833/GMT2024 Recording 1280x720.mp4',
          ],
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe(
        'https://dxyz.cloudfront.net/zoom/833/GMT2024%20Recording%201280x720.mp4',
      )
    })

    it('does not double-encode already-encoded S3 keys', () => {
      vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
      expect(
        resolveLectureVideoUrl({
          videos: [
            'https://masai-course.s3.ap-south-1.amazonaws.com/videos/a%20b.mp4',
          ],
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe('https://dxyz.cloudfront.net/masai-course/videos/a%20b.mp4')
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
