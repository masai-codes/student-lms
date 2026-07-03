import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getBookmarks } from '@/server/api/bookmarks/getBookmarks.service'
import { parseBookmarksQuery } from '@/server/api/bookmarks/utils/parseBookmarksQuery'

export async function handleGetBookmarks(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const params = parseBookmarksQuery(new URL(request.url))
    const { items, total } = await getBookmarks(userId, params)
    return jsonOk({ bookmarks: items, total })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch bookmarks', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_BOOKMARKS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
