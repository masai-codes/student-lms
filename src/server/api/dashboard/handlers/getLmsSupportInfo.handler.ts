import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getLmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'

export async function handleGetLmsSupportInfo(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const info = await getLmsSupportInfo(userId)
    return jsonOk({ lmsSupport: info })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch LMS support info', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_LMS_SUPPORT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
