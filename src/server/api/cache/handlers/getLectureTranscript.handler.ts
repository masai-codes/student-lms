import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getCachedLectureTranscript } from '@/server/api/cache/getLectureTranscript.service'

/**
 * Browsers hold a transcript for an hour; CloudFront holds it for a day. Both are
 * safe to overshoot — regenerating a transcript is rare and the edge can be
 * dropped early with a prefix invalidation (`/api/cache/transcript/<batch>/*`).
 */
const TRANSCRIPT_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, immutable'

/** Errors must never stick at the edge — a transcript still being generated 404s. */
const ERROR_CACHE_CONTROL = 'no-store'

function withCacheControl(response: Response, value: string): Response {
  response.headers.set('Cache-Control', value)
  return response
}

export async function handleGetCachedLectureTranscript(params: {
  batchId: string
  sectionId: string
  lectureId: string
}): Promise<Response> {
  try {
    const transcript = await getCachedLectureTranscript({
      batchId: parsePositiveIdParam(params.batchId, 'INVALID_BATCH_ID'),
      sectionId: parsePositiveIdParam(params.sectionId, 'INVALID_SECTION_ID'),
      lectureId: parsePositiveIdParam(params.lectureId, 'INVALID_LECTURE_ID'),
    })
    return withCacheControl(jsonOk(transcript), TRANSCRIPT_CACHE_CONTROL)
  } catch (error) {
    return withCacheControl(
      mapThrownErrorToResponse(error),
      ERROR_CACHE_CONTROL,
    )
  }
}
