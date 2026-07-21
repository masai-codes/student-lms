import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { dispatchAiTutorAgent } from '@/server/ai-tutor/services/aiTutorSession.service'

const dispatchBodySchema = z.object({
  roomName: z.string().min(1),
  agentName: z.string().min(1).optional(),
})

export async function handleDispatchAiTutorAgent(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = dispatchBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_AI_TUTOR_DISPATCH_PAYLOAD')
    }

    const result = await dispatchAiTutorAgent({
      userId,
      lectureId,
      roomName: parsed.data.roomName,
      agentName: parsed.data.agentName,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
