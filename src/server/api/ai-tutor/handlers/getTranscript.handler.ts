import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { fetchAiTutorTranscript } from '@/server/ai-tutor/services/aiTutorSession.service'

export async function handleGetAiTutorTranscript(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    const sessions = await fetchAiTutorTranscript({ userId, lectureId })
    return jsonOk({ sessions })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
