import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import {
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { endAiTutorSession } from '@/server/ai-tutor/services/aiTutorSession.service'

const endSessionBodySchema = z.object({
  sessionId: z.string().min(1),
})

export async function handleEndAiTutorSession(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)

    const rawBody = await request.json().catch(() => ({}))
    const parsed = endSessionBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_AI_TUTOR_END_PAYLOAD')
    }

    await endAiTutorSession({
      userId,
      sessionId: parsed.data.sessionId,
    })

    return jsonOk({ success: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
