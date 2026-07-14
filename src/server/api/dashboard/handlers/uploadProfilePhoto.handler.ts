import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { uploadProfilePhoto } from '@/server/api/dashboard/uploadProfilePhoto.service'

export async function handleUploadProfilePhoto(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as { image?: unknown }
    if (typeof body.image !== 'string' || body.image.trim() === '') {
      throw new ApiError(400, 'INVALID_IMAGE')
    }
    const result = await uploadProfilePhoto(userId, body.image)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to upload profile photo', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPLOADING_PROFILE_PHOTO'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
