import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordAgreementOpen } from '@/server/api/dashboard/recordAgreementOpen.service'

export async function handleRecordAgreementOpen(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0) return jsonOk({ success: false })
    await recordAgreementOpen(userId, id)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to record agreement open', error)
    return mapThrownErrorToResponse(error)
  }
}
