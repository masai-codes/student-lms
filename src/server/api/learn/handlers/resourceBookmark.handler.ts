import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  addLearnEntityBookmark,
  removeLearnEntityBookmark,
} from '@/server/learn/services/learnEntityBookmark.service'

export async function handleAddResourceBookmark(
  request: Request,
  resourceIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const resourceId = parsePositiveIdParam(
      resourceIdParam,
      'INVALID_RESOURCE_ID',
    )
    await addLearnEntityBookmark(userId, 'resource', resourceId)
    return jsonOk({ isBookmarked: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleRemoveResourceBookmark(
  request: Request,
  resourceIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const resourceId = parsePositiveIdParam(
      resourceIdParam,
      'INVALID_RESOURCE_ID',
    )
    await removeLearnEntityBookmark(userId, 'resource', resourceId)
    return jsonOk({ isBookmarked: false })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
