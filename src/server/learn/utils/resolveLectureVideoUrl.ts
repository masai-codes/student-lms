import { s3ToCloudFront } from '@/server/storage/s3ToCloudFront'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readGumletHlsUrl(vimeoDownloadLinks: unknown): string | null {
  if (!isRecord(vimeoDownloadLinks)) return null
  const gumlet = vimeoDownloadLinks.gumlet
  if (!isRecord(gumlet)) return null
  const hlsUrl = gumlet.hls_url
  return typeof hlsUrl === 'string' && hlsUrl.trim() !== ''
    ? hlsUrl.trim()
    : null
}

/**
 * Percent-encode each path segment unless the URL is already encoded —
 * mirrors the legacy LMS `uriEncode` so S3 keys with spaces/special chars
 * (common in Zoom recording names) stream correctly, especially on Safari.
 */
function uriEncodeIfNeeded(originalUri: string): string {
  const isEncoded = (uri: string) => {
    try {
      return uri !== decodeURIComponent(uri)
    } catch {
      return false
    }
  }
  if (isEncoded(originalUri)) return originalUri

  const [protocol, ...rest] = originalUri.split('://')
  if (rest.length === 0) return originalUri
  const encodedPath = rest
    .join('://')
    .split('/')
    .map(encodeURIComponent)
    .join('/')
  return `${protocol}://${encodedPath}`
}

function readRawVideoUrls(videos: unknown): string[] {
  if (typeof videos === 'string' && videos.trim() !== '') {
    return [videos.trim()]
  }
  if (!Array.isArray(videos)) return []

  return videos
    .filter(
      (item): item is string => typeof item === 'string' && item.trim() !== '',
    )
    .map((item) => item.trim())
}

function isMp4Url(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.mp4')
  } catch {
    return url.toLowerCase().includes('.mp4')
  }
}

function readVideosUrl(videos: unknown): string | null {
  const raw = readRawVideoUrls(videos)[0]
  return raw ? s3ToCloudFront(uriEncodeIfNeeded(raw)) : null
}

/** First `lectures.videos` URL, S3→CloudFront when applicable — same fallback as the lecture player. */
export function readLectureVideosRecordingUrl(videos: unknown): string | null {
  return readVideosUrl(videos)
}

/** First `.mp4` URL from `lectures.videos`, rewritten through CloudFront when configured. */
export function readLectureVideosMp4Url(videos: unknown): string | null {
  for (const raw of readRawVideoUrls(videos)) {
    if (!isMp4Url(raw)) continue
    return s3ToCloudFront(uriEncodeIfNeeded(raw))
  }
  return null
}

/**
 * Recording URL resolution — same gumlet → `videos` priority as
 * {@link resolveLectureVideoUrl}, without the Vimeo embed fallback.
 * S3 bucket URLs are rewritten through CloudFront when configured.
 */
export function resolveLectureRecordingVideoUrl(input: {
  vimeoDownloadLinks: unknown
  videos: unknown
}): string | null {
  return (
    readGumletHlsUrl(input.vimeoDownloadLinks) ?? readVideosUrl(input.videos)
  )
}

export function resolveLectureVideoUrl(input: {
  videos: unknown
  vimeoDownloadLinks: unknown
  vimeoPlayerEmbedUrl: string | null
}): string | null {
  return (
    readGumletHlsUrl(input.vimeoDownloadLinks) ??
    readVideosUrl(input.videos) ??
    (input.vimeoPlayerEmbedUrl?.trim()
      ? input.vimeoPlayerEmbedUrl.trim()
      : null)
  )
}
