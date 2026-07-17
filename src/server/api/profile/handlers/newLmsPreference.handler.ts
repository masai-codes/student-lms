import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  getNewLmsPagesPreference,
  markTryNewTourSeen,
  updateNewLmsPagesPreference,
} from '@/server/api/profile/newLmsPreference.service'

export async function handleGetNewLmsPagesPreference(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const enabled = await getNewLmsPagesPreference(userId)
    return jsonOk({ enabled })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch new-LMS-pages preference', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_NEW_LMS_PREFERENCE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleUpdateNewLmsPagesPreference(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as Record<string, unknown>

    if (typeof body.enabled !== 'boolean') {
      return mapThrownErrorToResponse(new Error('INVALID_ENABLED_FLAG'))
    }

    const feedback = typeof body.feedback === 'string' ? body.feedback : undefined

    const enabled = await updateNewLmsPagesPreference(
      userId,
      body.enabled,
      feedback,
    )
    return jsonOk({ enabled })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update new-LMS-pages preference', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_NEW_LMS_PREFERENCE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleMarkTryNewTourSeen(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    await markTryNewTourSeen(userId)
    return jsonOk({ seen: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to mark Try New tour as seen', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_MARKING_TRY_NEW_TOUR'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
