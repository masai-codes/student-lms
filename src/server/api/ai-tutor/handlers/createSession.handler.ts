import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { createAiTutorSession } from '@/server/ai-tutor/services/aiTutorSession.service'

const createSessionBodySchema = z.object({
  language: z.string().min(1).max(64).optional(),
})

export async function handleCreateAiTutorSession(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = createSessionBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_AI_TUTOR_SESSION_PAYLOAD')
    }

    const session = await createAiTutorSession({
      userId,
      lectureId,
      language: parsed.data.language ?? 'English',
    })

    return jsonOk({ session })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
