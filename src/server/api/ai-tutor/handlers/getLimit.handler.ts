import {
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { fetchAiTutorLimit } from '@/server/ai-tutor/services/aiTutorSession.service'

export async function handleGetAiTutorLimit(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const status = await fetchAiTutorLimit({ userId })
    return jsonOk(status)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
