import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitAgreement } from '@/server/api/dashboard/submitAgreement.service'

export async function handleSubmitAgreement(
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0) return jsonOk({ success: false })

    await submitAgreement(id, userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to submit agreement', error)
    return mapThrownErrorToResponse(error)
  }
}
