import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getT0FlowLectures } from '@/server/api/dashboard/getT0FlowLectures.service'
import { guidedTourPlatformFromRequest } from '@/server/api/dashboard/t0/requestPlatform'

export async function handleGetT0FlowLectures(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const url = new URL(request.url)
    const batchIdParam = url.searchParams.get('batchId')
    const batchId = batchIdParam ? Number(batchIdParam) : undefined
    const platform = guidedTourPlatformFromRequest(request)
    const data = await getT0FlowLectures(userId, batchId, platform)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch T0 flow lectures', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_T0_FLOW_LECTURES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
