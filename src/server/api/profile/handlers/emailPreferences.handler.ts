import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  getEmailPreferences,
  parsePreferencePatch,
  updateEmailPreferences,
} from '@/server/api/profile/emailPreferences.service'

export async function handleGetEmailPreferences(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const preferences = await getEmailPreferences(userId)
    return jsonOk({ preferences })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch email preferences', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_EMAIL_PREFERENCES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleUpdateEmailPreferences(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as unknown
    const preferences = await updateEmailPreferences(
      userId,
      parsePreferencePatch(body),
    )
    return jsonOk({ preferences })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update email preferences', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_EMAIL_PREFERENCES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
