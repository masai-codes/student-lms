import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

/**
 * Fetches the adaptive ("SAL") lecture join URL for a lecture: a lecture-scoped,
 * tenant-hosted link carrying a freshly minted `?token=` fallback. Mirrors
 * `fetchZoomRedirectUrlViaApi` (the ZEF flow).
 */
export async function fetchAdaptiveJoinUrlViaApi(
  lectureId: number,
): Promise<string> {
  try {
    const { url } = await fetchJson<{ url: string }>(
      LEARN_API.lectureAdaptiveJoin(lectureId),
      { method: 'POST' },
    )
    return url
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}
