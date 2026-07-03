import { isApiError } from '@/server/api/http/apiError'
import {
  jsonOk,
  jsonError,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  addAnnouncementBookmark,
  removeAnnouncementBookmark,
} from '@/server/api/announcement/announcementBookmark.service'

export async function handleAddBookmark(
  request: Request,
  rawId: string,
): Promise<Response> {
  try {
    const entityId = parseInt(rawId, 10)
    if (!Number.isFinite(entityId) || entityId <= 0)
      return jsonError(400, 'INVALID_ID')

    const userId = await requireSessionUserId()
    const bookmarkId = await addAnnouncementBookmark(userId, entityId)
    return jsonOk({ bookmarkId })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to add bookmark', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_ADD_BOOKMARK'))
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleRemoveBookmark(
  request: Request,
  rawId: string,
): Promise<Response> {
  try {
    const bookmarkId = parseInt(rawId, 10)
    if (!Number.isFinite(bookmarkId) || bookmarkId <= 0)
      return jsonError(400, 'INVALID_ID')

    await requireSessionUserId()
    await removeAnnouncementBookmark(bookmarkId)
    return jsonOk({ ok: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to remove bookmark', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_REMOVE_BOOKMARK'))
    }
    return mapThrownErrorToResponse(error)
  }
}
