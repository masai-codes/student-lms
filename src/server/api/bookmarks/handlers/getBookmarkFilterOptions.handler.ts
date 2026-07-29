import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getBookmarkFilterOptions } from '@/server/api/bookmarks/getBookmarkFilterOptions.service'
import { BOOKMARK_TABS } from '@/components/features/bookmarks/bookmarksConfig'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'

const VALID_TABS = new Set<string>(BOOKMARK_TABS.map((t) => t.id))

export async function handleGetBookmarkFilterOptions(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const rawTab = new URL(request.url).searchParams.get('tab')
    const tab: BookmarkTab =
      rawTab && VALID_TABS.has(rawTab) ? (rawTab as BookmarkTab) : 'lectures'
    const options = await getBookmarkFilterOptions(userId, tab)
    return jsonOk(options)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch bookmark filter options', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_BOOKMARK_FILTER_OPTIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
