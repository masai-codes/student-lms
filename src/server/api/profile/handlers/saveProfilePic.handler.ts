import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { isApiError } from '@/server/api/http/apiError'
import { saveProfilePicUrl } from '@/server/api/profile/saveProfilePic.service'

export async function handleSaveProfilePic(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as Record<string, unknown>

    const s3Url = body.s3Url
    if (typeof s3Url !== 'string' || !s3Url.startsWith('https://')) {
      return jsonError(400, 'INVALID_S3_URL', 'A valid S3 URL is required')
    }

    await saveProfilePicUrl(userId, s3Url)

    return jsonOk({ ok: true })
  } catch (error) {
    if (isApiError(error)) return mapThrownErrorToResponse(error)
    console.error('Failed to save profile pic URL', error)
    return jsonError(500, 'SERVER_ERROR_SAVING_PROFILE_PIC')
  }
}
