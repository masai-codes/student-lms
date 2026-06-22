import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncementPopups } from '@/server/api/announcement/getAnnouncementPopups.service'

export async function handleGetAnnouncementPopups(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const popups = await getAnnouncementPopups(userId)
    return jsonOk({ popups })
  } catch (error) {
    console.error('Failed to fetch announcement popups', error)
    return mapThrownErrorToResponse(error instanceof Error ? error : new Error('SERVER_ERROR'))
  }
}
