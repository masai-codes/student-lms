import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parseLearnPageQuery } from '@/server/api/learn/utils/parseLearnPageQuery'
import { getLearnPageData } from '@/server/learn/services/getLearnPageData.service'

export async function handleGetLearnPageData(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const input = parseLearnPageQuery(new URL(request.url))
    const data = await getLearnPageData(input, userId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch learn page data', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_LEARN_PAGE_DATA'))
    }
    return mapThrownErrorToResponse(error)
  }
}
