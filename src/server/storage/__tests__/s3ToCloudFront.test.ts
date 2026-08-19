import { afterEach, describe, expect, it, vi } from 'vitest'
import { mapS3UrlToCdn, s3ToCloudFront } from '@/server/storage/s3ToCloudFront'

afterEach(() => vi.unstubAllEnvs())

describe('s3ToCloudFront', () => {
  it('returns the URL untouched when no CDN base is configured', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', '')
    const url = 'https://masai-course.s3.amazonaws.com/a/b.png'
    expect(s3ToCloudFront(url)).toBe(url)
  })

  it('rewrites known buckets to their CDN origin', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    expect(
      s3ToCloudFront('https://zoom-lecture-recordings.s3.amazonaws.com/x.mp4'),
    ).toBe('https://dxyz.cloudfront.net/zoom/x.mp4')
    expect(
      s3ToCloudFront('https://coding-platform.s3.amazonaws.com/x.png'),
    ).toBe('https://dxyz.cloudfront.net/coding-platform/x.png')
  })

  it('defaults an unknown bucket to masai-course', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    expect(s3ToCloudFront('https://mystery.s3.amazonaws.com/x.png')).toBe(
      'https://dxyz.cloudfront.net/masai-course/x.png',
    )
  })

  it('tolerates a trailing slash on the configured base', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net/')
    expect(s3ToCloudFront('https://masai-course.s3.amazonaws.com/x.png')).toBe(
      'https://dxyz.cloudfront.net/masai-course/x.png',
    )
  })

  it('returns the input when there is no path to rewrite', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    expect(s3ToCloudFront('https://masai-course.s3.amazonaws.com')).toBe(
      'https://masai-course.s3.amazonaws.com',
    )
  })
})

describe('mapS3UrlToCdn', () => {
  it('rewrites S3 URLs', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    expect(
      mapS3UrlToCdn('https://coding-platform.s3.amazonaws.com/badge.png'),
    ).toBe('https://dxyz.cloudfront.net/coding-platform/badge.png')
  })

  it('leaves non-S3 URLs alone', () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    expect(mapS3UrlToCdn('https://cdn.other.com/badge.png')).toBe(
      'https://cdn.other.com/badge.png',
    )
  })

  it('returns an empty string for non-string or blank input', () => {
    expect(mapS3UrlToCdn(null)).toBe('')
    expect(mapS3UrlToCdn(42)).toBe('')
    expect(mapS3UrlToCdn('   ')).toBe('')
  })
})
