import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { dismissAgreement } from '@/server/api/dashboard/dismissAgreement.service'

export async function handleDismissAgreement(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0) return jsonOk({ success: false })
    await dismissAgreement(userId, id)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to dismiss agreement', error)
    return mapThrownErrorToResponse(error)
  }
}
