import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  acceptUndertaking,
  getPendingUndertakings,
} from '@/server/api/profile/undertakings.service'

export async function handleGetUndertakings(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const undertakings = await getPendingUndertakings(userId)
    return jsonOk({ undertakings })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch pending undertakings', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_UNDERTAKINGS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleAcceptUndertaking(
  sectionId: number,
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as Record<string, unknown>

    if (typeof body.location !== 'string') {
      throw new ApiError(400, 'LOCATION_REQUIRED')
    }

    await acceptUndertaking(userId, {
      sectionId,
      location: body.location,
      ipAddress: typeof body.ipAddress === 'string' ? body.ipAddress : '',
    })

    return jsonOk({ accepted: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to accept undertaking', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_ACCEPTING_UNDERTAKING'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
