import type { LectureTranscriptPayload } from '@/server/learn/lectureDetailTypes'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'

/**
 * Fetch a lecture transcript from its CloudFront-cached path. The `url` always
 * comes from `tabs.transcript.url` on the lecture payload — the server owns the
 * path shape (see `CACHE_API`).
 *
 * A 404 means "no transcript for this lecture" rather than a failure: the
 * availability flag on the page is only a hint, so resolve to an empty transcript
 * and let the caller render its normal empty state.
 */
export async function fetchLectureTranscriptFromCache(
  url: string,
): Promise<LectureTranscriptPayload> {
  try {
    return await fetchJson<LectureTranscriptPayload>(url)
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return { lectureId: 0, segments: [], text: null }
    }
    throw error
  }
}
