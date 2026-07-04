import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncementUnreadCount } from '@/server/api/announcement/getAnnouncementUnreadCount.service'

export async function handleGetAnnouncementUnreadCount(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const count = await getAnnouncementUnreadCount(userId)
    return jsonOk({ count })
  } catch (error) {
    console.error('Failed to fetch announcement unread count', error)
    return mapThrownErrorToResponse(
      error instanceof Error ? error : new Error('SERVER_ERROR'),
    )
  }
}
