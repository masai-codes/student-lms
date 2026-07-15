import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { ingestLectureRag } from '@/server/api/ai-tutor/ingestLectureRag.service'
import { requireAiTutorInternalSecret } from '@/server/api/ai-tutor/http/requireAiTutorInternalSecret'

function parsePositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function handleIngestLectureRag(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    requireAiTutorInternalSecret(request)

    const lectureId = parsePositiveInt(lectureIdParam)
    if (!lectureId) {
      throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
    }

    const data = await ingestLectureRag(lectureId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to ingest lecture RAG content', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_INGESTING_LECTURE_RAG'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
