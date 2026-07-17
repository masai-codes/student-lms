import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClientIp } from '@/server/api/http/clientIp'
import { submitAgreement } from '@/server/api/dashboard/agreement/submitAgreement.service'

export async function handleSubmitAgreement(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as { sectionId?: unknown }
    const sectionId = Number(body.sectionId)
    if (!Number.isFinite(sectionId) || sectionId <= 0)
      throw new ApiError(400, 'INVALID_SECTION_ID')

    const result = await submitAgreement(
      userId,
      sectionId,
      getClientIp(request),
    )
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to submit agreement', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_SUBMITTING_AGREEMENT'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
