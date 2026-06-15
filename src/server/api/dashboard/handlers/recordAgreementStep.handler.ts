import { isApiError } from '@/server/api/http/apiError'
import { jsonError, jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordAgreementStep } from '@/server/api/dashboard/recordAgreementStep.service'

export async function handleRecordAgreementStep(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0) return jsonError(400, 'INVALID_SECTION_ID')

    const body = await request.json() as { stepKey?: unknown }
    const stepKey = body?.stepKey
    if (typeof stepKey !== 'string' || stepKey.trim() === '') return jsonError(400, 'INVALID_STEP_KEY')

    await recordAgreementStep(id, userId, stepKey.trim())
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to record agreement step', error)
    return mapThrownErrorToResponse(error)
  }
}
