import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncementFilterOptions } from '@/server/api/announcement/getAnnouncementFilterOptions.service'

export async function handleGetAnnouncementFilterOptions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const { categories, announcers } =
      await getAnnouncementFilterOptions(userId)
    return jsonOk({ categories, announcers })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch announcement filter options', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ANNOUNCEMENT_FILTER_OPTIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
