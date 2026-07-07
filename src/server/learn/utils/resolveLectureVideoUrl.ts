function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readGumletHlsUrl(vimeoDownloadLinks: unknown): string | null {
  if (!isRecord(vimeoDownloadLinks)) return null
  const gumlet = vimeoDownloadLinks.gumlet
  if (!isRecord(gumlet)) return null
  const hlsUrl = gumlet.hls_url
  return typeof hlsUrl === 'string' && hlsUrl.trim() !== '' ? hlsUrl.trim() : null
}

/**
 * Bucket-name → CloudFront origin path segment. Mirrors the legacy LMS mapping
 * in `s3ToCloudFront.utils.ts` so Zoom recordings, platform assets, etc. all
 * resolve through the CDN rather than hitting private S3 buckets.
 */
function bucketToOrigin(bucketName: string): string {
  switch (bucketName) {
    case 'zoom-lecture-recordings':
      return 'zoom'
    case 'masai-course':
      return 'masai-course'
    case 'coding-platform':
      return 'coding-platform'
    case 'ai-buddy-dev-assets':
      return 'ai-buddy-dev-assets'
    default:
      return 'masai-course'
  }
}

/**
 * Rewrite an `https://<bucket>.s3…/key` S3 URL to
 * `https://<CLOUD_FRONT_BASE>/<origin>/key` so the browser can stream the
 * video through CloudFront. When CLOUD_FRONT_BASE is not configured, the raw
 * S3 URL is returned (will only work if the bucket is public).
 */
function s3ToCloudFront(url: string): string {
  const base = process.env.CLOUD_FRONT_BASE?.trim().replace(/\/$/, '')
  if (!base) return url

  try {
    const withoutScheme = url.replace(/^https?:\/\//, '')
    const slashIdx = withoutScheme.indexOf('/')
    if (slashIdx < 0) return url

    const host = withoutScheme.slice(0, slashIdx)
    const path = withoutScheme.slice(slashIdx) // e.g. /83318450964/…
    const bucketName = host.split('.')[0] ?? ''
    const origin = bucketToOrigin(bucketName)

    return `https://${base}/${origin}${path}`
  } catch {
    return url
  }
}

function readVideosUrl(videos: unknown): string | null {
  let raw: string | null = null

  if (typeof videos === 'string' && videos.trim() !== '') {
    raw = videos.trim()
  } else if (Array.isArray(videos)) {
    const first = videos[0]
    if (typeof first === 'string' && first.trim() !== '') {
      raw = first.trim()
    }
  }

  return raw ? s3ToCloudFront(raw) : null
}

export function resolveLectureVideoUrl(input: {
  videos: unknown
  vimeoDownloadLinks: unknown
  vimeoPlayerEmbedUrl: string | null
}): string | null {
  return (
    readGumletHlsUrl(input.vimeoDownloadLinks) ??
    readVideosUrl(input.videos) ??
    (input.vimeoPlayerEmbedUrl?.trim() ? input.vimeoPlayerEmbedUrl.trim() : null)
  )
}
