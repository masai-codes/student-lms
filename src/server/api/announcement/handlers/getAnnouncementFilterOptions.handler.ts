import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAnnouncementFilterOptions } from '@/server/api/announcement/getAnnouncementFilterOptions.service'

export async function handleGetAnnouncementFilterOptions(): Promise<Response> {
  try {
    await requireSessionUserId()
    const { categories } = await getAnnouncementFilterOptions()
    return jsonOk({ categories })
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
