import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { submitLectureFeedback } from '@/server/learn/services/lectureFeedback.service'

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(191).optional(),
})

export async function handleSubmitLectureFeedback(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_FEEDBACK_PAYLOAD')
    }

    const text = parsed.data.feedback?.trim()
    const result = await submitLectureFeedback({
      userId,
      lectureId,
      rating: parsed.data.rating,
      text: text && text.length > 0 ? text : null,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
