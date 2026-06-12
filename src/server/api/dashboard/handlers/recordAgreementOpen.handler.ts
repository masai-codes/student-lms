import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordAgreementOpen } from '@/server/api/dashboard/recordAgreementOpen.service'

export async function handleRecordAgreementOpen(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    await recordAgreementOpen(userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to record agreement open', error)
    return mapThrownErrorToResponse(error)
  }
}
