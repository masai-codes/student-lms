import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { saveAgreementDetails } from '@/server/api/dashboard/saveAgreementDetails.service'
import type { AgreementDetailsData } from '@/server/api/dashboard/saveAgreementDetails.service'

export async function handleSaveAgreementDetails(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0)
      return jsonError(400, 'INVALID_SECTION_ID')

    const deviceDetails = request.headers.get('user-agent') ?? 'unknown'

    const body = (await request.json()) as { data?: AgreementDetailsData }
    const data = body?.data
    if (!data) return jsonError(400, 'INVALID_DATA')

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      (data.clientIp && data.clientIp !== '127.0.0.1' && data.clientIp !== '::1'
        ? data.clientIp
        : null) ??
      'unknown'

    await saveAgreementDetails(id, userId, data, ipAddress, deviceDetails)
    return jsonOk({
      success: true,
      ipAddress,
      referenceNumber: `TC-${userId}-section_${id}`,
    })
  } catch (error) {
    if (!isApiError(error))
      console.error('Failed to save agreement details', error)
    return mapThrownErrorToResponse(error)
  }
}
