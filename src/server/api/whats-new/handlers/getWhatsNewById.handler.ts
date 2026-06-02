import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getWhatsNewById } from '@/server/api/whats-new/getWhatsNewById.service'

export async function handleGetWhatsNewById(
  _request: Request,
  idParam: string,
): Promise<Response> {
  try {
    const id = parseInt(idParam, 10)
    if (!Number.isFinite(id) || id <= 0) {
      return jsonError(404, 'WHATS_NEW_NOT_FOUND')
    }

    const item = await getWhatsNewById(id)
    if (!item) {
      return jsonError(404, 'WHATS_NEW_NOT_FOUND')
    }

    return jsonOk({ item })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch whats-new detail', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_WHATS_NEW_DETAIL'))
    }
    return mapThrownErrorToResponse(error)
  }
}
