import { isApiError } from '@/server/api/http/apiError'
import {
  jsonOk,
  jsonError,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  markAnnouncementAsUnread,
  markMessageAsUnread,
} from '@/server/api/announcement/markAnnouncementUnread.service'

export async function handleMarkAnnouncementUnread(
  request: Request,
  rawId: string,
  source: 'a' | 'm' = 'a',
): Promise<Response> {
  try {
    const numericId = parseInt(rawId, 10)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return jsonError(400, 'INVALID_ID')
    }

    const userId = await requireSessionUserId()

    if (source === 'm') {
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
