import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getLectureAiChatSuggestions } from '@/server/api/ai-tutor/services/getLectureAiChatSuggestions.service'

/**
 * Public and cookie-free by design (`/api/cache/*` forwards no cookies to the
 * origin — see cloudformation.yml): the suggestions are identical for every
 * viewer of a given lecture, so there is no session check here.
 */
const SUGGESTIONS_CACHE_CONTROL = 'public, max-age=300, s-maxage=300'

/** Errors must never stick at the edge. */
const ERROR_CACHE_CONTROL = 'no-store'

function withCacheControl(response: Response, value: string): Response {
  response.headers.set('Cache-Control', value)
  return response
}

export async function handleGetCachedLectureAiChatSuggestions(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const lectureId = parsePositiveIdParam(
      lectureIdParam,
      'AI_TUTOR_LECTURE_ID_INVALID',
    )
    const suggestions = await getLectureAiChatSuggestions(lectureId)
    return withCacheControl(jsonOk({ suggestions }), SUGGESTIONS_CACHE_CONTROL)
  } catch (error) {
    return withCacheControl(
      mapThrownErrorToResponse(error),
      ERROR_CACHE_CONTROL,
    )
  }
}
