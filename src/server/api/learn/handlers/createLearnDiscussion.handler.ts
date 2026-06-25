import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createDiscussionForLearnEntity } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { parseCreateDiscussionInput } from '@/server/new-discussions/utils/validateDiscussionWriteInput'

const bodySchema = z.object({
  kind: z.enum(['lecture', 'assignment']),
  entityId: z.number(),
  title: z.string(),
  message: z.string(),
})

export async function handleCreateLearnDiscussion(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_DISCUSSION_PAYLOAD')
    }

    if (!Number.isFinite(parsed.data.entityId) || parsed.data.entityId <= 0) {
      throw new ApiError(400, 'INVALID_ENTITY_ID')
    }

    const { title, message } = parseCreateDiscussionInput({
      title: parsed.data.title,
      message: parsed.data.message,
    })

    const result = await createDiscussionForLearnEntity({
      authorUserId: userId,
      kind: parsed.data.kind,
      entityId: parsed.data.entityId,
      title,
      message,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
