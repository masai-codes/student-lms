import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { endInLectureQuizAssessment } from '@/server/learn/services/endInLectureQuizAssessment.service'

const bodySchema = z.object({
  assessmentTemplateId: z.string().min(1),
  token: z.string().min(1),
})

export async function handleEndInLectureQuizAssessment(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_QUIZ_PAYLOAD')
    }

    const result = await endInLectureQuizAssessment({
      userId,
      lectureId,
      assessmentTemplateId: parsed.data.assessmentTemplateId,
      token: parsed.data.token,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
