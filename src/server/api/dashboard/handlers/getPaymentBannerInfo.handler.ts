import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getPaymentBannerInfo } from '@/server/api/dashboard/getPaymentBannerInfo.service'

export async function handleGetPaymentBannerInfo(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const paymentBanner = await getPaymentBannerInfo(userId)
    return jsonOk({ paymentBanner })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch payment banner info', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_PAYMENT_BANNER'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
