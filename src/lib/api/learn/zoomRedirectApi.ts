import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

/** Fetches the ZEF join URL for a lecture (new zoom redirection flow). */
export async function fetchZoomRedirectUrlViaApi(
  lectureId: number,
): Promise<string> {
  try {
    const { url } = await fetchJson<{ url: string }>(
      LEARN_API.lectureZoomRedirect(lectureId),
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
