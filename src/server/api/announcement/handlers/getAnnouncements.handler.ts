import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncements } from '@/server/api/announcement/getAnnouncements.service'
import { parseAnnouncementsQuery } from '@/server/api/announcement/utils/parseAnnouncementsQuery'

export async function handleGetAnnouncements(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const params = parseAnnouncementsQuery(new URL(request.url))
    const { announcements, total } = await getAnnouncements(userId, params)
    return jsonOk({ announcements, total })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch announcements', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ANNOUNCEMENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
