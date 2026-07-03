import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getResourceLearningDetailForUser } from '@/server/learn/services/getResourceLearningDetail.service'

export async function handleGetResourceLearningDetail(
  request: Request,
  resourceIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const resourceId = parsePositiveIdParam(
      resourceIdParam,
      'INVALID_RESOURCE_ID',
    )
    const detail = await getResourceLearningDetailForUser(userId, resourceId)
    return jsonOk(detail)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
