import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordAgreementViewed } from '@/server/api/dashboard/agreement/recordAgreementViewed.service'

export async function handleRecordAgreementViewed(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as { sectionId?: unknown }
    const sectionId = Number(body.sectionId)
    if (!Number.isFinite(sectionId) || sectionId <= 0)
      throw new ApiError(400, 'INVALID_SECTION_ID')

    const result = await recordAgreementViewed(userId, sectionId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to record agreement view', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_RECORDING_AGREEMENT_VIEW'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
