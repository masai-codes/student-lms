import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { markAnnouncementAsRead, markMessageAsRead } from '@/server/api/announcement/markAnnouncementRead.service'

export async function handleMarkAnnouncementRead(
  request: Request,
  rawId: string,
  source: 'a' | 'm' = 'a',
): Promise<Response> {
  try {
    const numericId = parseInt(rawId, 10)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return jsonError(400, 'INVALID_ID')
    }

    const userId = await requireSessionUserId(request)

    if (source === 'm') {
      await markMessageAsRead(userId, numericId)
    } else {
      await markAnnouncementAsRead(userId, numericId)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to mark as read', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_MARK_READ'))
    }
    return mapThrownErrorToResponse(error)
  }
}
