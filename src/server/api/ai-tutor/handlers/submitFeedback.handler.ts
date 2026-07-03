import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { submitAiTutorFeedback } from '@/server/ai-tutor/services/aiTutorSession.service'

const feedbackBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional(),
})

export async function handleSubmitAiTutorFeedback(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = feedbackBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_AI_TUTOR_FEEDBACK_PAYLOAD')
    }

    await submitAiTutorFeedback({
      userId,
      lectureId,
      rating: parsed.data.rating,
      feedback: parsed.data.feedback ?? null,
    })

    return jsonOk({ success: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
