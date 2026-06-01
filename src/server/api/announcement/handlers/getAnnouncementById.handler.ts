import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncementById } from '@/server/api/announcement/getAnnouncementById.service'

export async function handleGetAnnouncementById(
  request: Request,
  announcementId: string,
): Promise<Response> {
  try {
    const id = parseInt(announcementId, 10)
    if (!Number.isFinite(id) || id <= 0) {
      return jsonError(404, 'ANNOUNCEMENT_NOT_FOUND')
    }

    const userId = await requireSessionUserId(request)
    const announcement = await getAnnouncementById(userId, id)

    if (!announcement) {
      return jsonError(404, 'ANNOUNCEMENT_NOT_FOUND')
    }

    return jsonOk({ announcement })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch announcement', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ANNOUNCEMENT'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
