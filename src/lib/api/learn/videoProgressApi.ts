import type { StoreVideoProgressInput } from '@/server/video-attendance/types'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

export type StoreVideoProgressResult = { ok: boolean }

/**
 * Persists watched intervals for a lecture recording via the REST endpoint.
 * Failures (auth/upstream) resolve to `{ ok: false }` so the caller's retry
 * policy handles them rather than throwing inside fire-and-forget save loops.
 */
export async function storeLectureVideoProgressViaApi(
  input: StoreVideoProgressInput,
): Promise<StoreVideoProgressResult> {
  try {
    return await fetchJson<StoreVideoProgressResult>(
      LEARN_API.lectureVideoProgress(input.lectureId),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalDuration: input.totalDuration,
          intervals: input.intervals,
          sessionToken: input.sessionToken,
        }),
      },
    )
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { ok: false }
    }
    throw error
  }
}
