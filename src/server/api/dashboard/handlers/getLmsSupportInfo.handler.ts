import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getLmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'

export async function handleGetLmsSupportInfo(_request: Request): Promise<Response> {
  try {
    const info = await getLmsSupportInfo()
    return jsonOk({ lmsSupport: info })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch LMS support info', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_LMS_SUPPORT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
