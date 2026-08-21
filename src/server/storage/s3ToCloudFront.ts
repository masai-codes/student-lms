/**
 * S3 → CloudFront URL rewriting, shared by the lecture player and the profile
 * achievements service (badge images live in the same buckets).
 *
 * Mirrors the legacy LMS `s3ToCloudFront.utils.ts` bucket → origin mapping.
 */

/** Bucket-name → CloudFront origin path segment. */
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
 * `https://<CLOUD_FRONT_BASE>/<origin>/key` so the browser fetches through the
 * CDN rather than hitting a private bucket. Returns the input unchanged when
 * `CLOUD_FRONT_BASE` is unset or the URL isn't parseable as an S3 URL.
 */
export function s3ToCloudFront(url: string): string {
  const base = process.env.CLOUD_FRONT_BASE?.trim().replace(/\/$/, '')
  if (!base) return url

  try {
    const withoutScheme = url.replace(/^https?:\/\//, '')
    const slashIdx = withoutScheme.indexOf('/')
    if (slashIdx < 0) return url

    const host = withoutScheme.slice(0, slashIdx)
    const path = withoutScheme.slice(slashIdx)
    const bucketName = host.split('.')[0] ?? ''

    return `https://${base}/${bucketName ? bucketToOrigin(bucketName) : 'masai-course'}${path}`
  } catch {
    return url
  }
}

/**
 * Same rewrite, but only for URLs that actually point at S3 — used for stored
 * asset URLs that may already be CDN or third-party links.
 */
export function mapS3UrlToCdn(url: unknown): string {
  const source = typeof url === 'string' ? url.trim() : ''
  if (source === '' || !source.includes('amazonaws.com')) return source
  return s3ToCloudFront(source)
}
