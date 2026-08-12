import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getLectureFaqs } from '@/server/api/ai-tutor/services/getLectureFaqs.service'

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function handleGetLectureFaqs(
  lectureIdParam: string,
): Promise<Response> {
  try {
    await requireSessionUserId()
    const lectureId = parsePositiveInt(lectureIdParam)
    if (!lectureId) {
      throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
    }

    const faqs = await getLectureFaqs(lectureId)
    return jsonOk({ faqs })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch ai-tutor lecture faqs', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_AI_TUTOR_LECTURE_FAQS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
