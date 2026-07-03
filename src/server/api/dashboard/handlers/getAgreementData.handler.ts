import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAgreementData } from '@/server/api/dashboard/getAgreementData.service'

export async function handleGetAgreementData(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0)
      return jsonError(400, 'INVALID_SECTION_ID')

    const data = await getAgreementData(id, userId)
    return jsonOk(data)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'AGREEMENT_SECTION_NOT_FOUND'
    ) {
      return jsonError(404, 'AGREEMENT_SECTION_NOT_FOUND')
    }
    if (!isApiError(error))
      console.error('Failed to fetch agreement data', error)
    return mapThrownErrorToResponse(error)
  }
}
