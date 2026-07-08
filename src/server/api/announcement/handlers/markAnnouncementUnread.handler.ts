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
  rawId: string,
  source: 'a' | 'm' = 'a',
): Promise<Response> {
  try {
    // Validate as a positive integer string. Messages use BigInt ids that can
    // exceed Number.MAX_SAFE_INTEGER, so keep the id as a string rather than
    // parseInt-ing it and losing precision.
    if (!/^\d+$/.test(rawId) || /^0+$/.test(rawId)) {
      return jsonError(400, 'INVALID_ID')
    }

    const userId = await requireSessionUserId()

    if (source === 'm') {
      await markMessageAsUnread(userId, rawId)
    } else {
      await markAnnouncementAsUnread(userId, parseInt(rawId, 10))
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
