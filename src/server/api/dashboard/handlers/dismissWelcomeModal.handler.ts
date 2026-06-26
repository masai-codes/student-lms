import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { dismissWelcomeModal } from '@/server/api/dashboard/dismissWelcomeModal.service'

export async function handleDismissWelcomeModal(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    await dismissWelcomeModal(userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to dismiss welcome modal', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_DISMISSING_WELCOME_MODAL'))
    }
    return mapThrownErrorToResponse(error)
  }
}
