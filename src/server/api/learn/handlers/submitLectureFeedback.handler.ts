import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { submitLectureFeedback } from '@/server/learn/services/lectureFeedback.service'
import { LECTURE_FEEDBACK_TAGS } from '@/server/learn/utils/lectureFeedbackTags'

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(191).optional(),
  tags: z.array(z.enum(LECTURE_FEEDBACK_TAGS)).max(5).optional(),
})

export async function handleSubmitLectureFeedback(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_FEEDBACK_PAYLOAD')
    }

    const text = parsed.data.feedback?.trim()
    const tags = Array.from(new Set(parsed.data.tags ?? []))
    const result = await submitLectureFeedback({
      userId,
      lectureId,
      rating: parsed.data.rating,
      text: text && text.length > 0 ? text : null,
      tags,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
