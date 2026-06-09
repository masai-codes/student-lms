import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { markAnnouncementAsUnread, markMessageAsUnread } from '@/server/api/announcement/markAnnouncementUnread.service'

export async function handleMarkAnnouncementUnread(
  request: Request,
  rawId: string,
): Promise<Response> {
  try {
    const numericId = parseInt(rawId, 10)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return jsonError(400, 'INVALID_ID')
    }

    const src = new URL(request.url).searchParams.get('src')
    const userId = await requireSessionUserId(request)

    if (src === 'm') {
      await markMessageAsUnread(userId, numericId)
    } else {
      await markAnnouncementAsUnread(userId, numericId)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to mark as unread', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_MARK_UNREAD'))
    }
    return mapThrownErrorToResponse(error)
  }
}
