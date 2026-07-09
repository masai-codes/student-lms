import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClientIp } from '@/server/api/http/clientIp'
import { saveAgreementDetails } from '@/server/api/dashboard/agreement/saveAgreementDetails.service'
import type { AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

export async function handleSaveAgreementDetails(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as { sectionId?: unknown; values?: unknown }
    const sectionId = Number(body.sectionId)
    if (!Number.isFinite(sectionId) || sectionId <= 0) throw new ApiError(400, 'INVALID_SECTION_ID')
    const values = (body.values ?? {}) as AgreementFormValues

    const result = await saveAgreementDetails(userId, sectionId, values, getClientIp(request))
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to save agreement details', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_SAVING_AGREEMENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
