import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createMasaiverseClub } from '@/server/api/masaiverse-v2/services/createClub.service'

export async function handleCreateClub(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const created = await createMasaiverseClub(userId)
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create club', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CREATING_CLUB'))
    }
    return mapThrownErrorToResponse(error)
  }
}
