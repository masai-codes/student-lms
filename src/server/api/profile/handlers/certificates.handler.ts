import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCertificates } from '@/server/api/profile/certificates.service'

export async function handleGetCertificates(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const certificates = await getCertificates(userId)
    return jsonOk({ certificates })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch certificates', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_CERTIFICATES'))
    }
    return mapThrownErrorToResponse(error)
  }
}
