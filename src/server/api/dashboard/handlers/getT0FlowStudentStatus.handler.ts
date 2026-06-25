import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getT0FlowStudentStatus } from '@/server/api/dashboard/getT0FlowStudentStatus.service'

export async function handleGetT0FlowStudentStatus(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const url = new URL(request.url)
    const batchId = Number(url.searchParams.get('batchId'))
    if (!batchId) return jsonOk({ documents: null, kit: null })
    const data = await getT0FlowStudentStatus(userId, batchId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch T0 flow student status', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_T0_FLOW_STUDENT_STATUS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
