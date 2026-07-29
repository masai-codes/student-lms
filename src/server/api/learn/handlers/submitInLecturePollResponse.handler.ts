import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { saveInLecturePollSubmission } from '@/server/learn/services/saveInLecturePollSubmission.service'

const bodySchema = z.object({
  pollId: z.union([z.string(), z.number()]),
  selectedOptionIndex: z.number().int().min(0),
})

export async function handleSubmitInLecturePollResponse(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_POLL_SUBMIT_PAYLOAD')
    }
    const pollId = parsePositiveIdParam(
      String(parsed.data.pollId),
      'INVALID_POLL_ID',
    )

    const result = await saveInLecturePollSubmission({
      userId,
      lectureId,
      pollId,
      selectedOptionIndex: parsed.data.selectedOptionIndex,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
