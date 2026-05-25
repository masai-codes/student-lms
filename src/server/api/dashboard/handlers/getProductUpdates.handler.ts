import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getProductUpdates } from '@/server/api/dashboard/getProductUpdates.service'

export async function handleGetProductUpdates(_request: Request): Promise<Response> {
  try {
    const productUpdates = await getProductUpdates()
    return jsonOk({ productUpdates })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch product updates', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_PRODUCT_UPDATES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
