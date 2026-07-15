import { getOldStudentUiUrlFromEnv } from '@/utils/viteEnv'

/**
 * Embedded "Zoom Web View" is not reimplemented in the new LMS — we reuse the old
 * LMS's proven Zoom Web SDK page by opening `/lectures/:id/zoom` there. The two
 * apps share a session cookie, so the old page authenticates seamlessly.
 *
 * Returns null when the legacy base URL can't be resolved, so callers can fall
 * back to the raw join link.
 */
export function buildZoomWebViewUrl(lectureId: number): string | null {
  const base = getOldStudentUiUrlFromEnv()
  return base ? `${base}/lectures/${lectureId}/zoom` : null
}
