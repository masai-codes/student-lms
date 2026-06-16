import { generatePresignedUploadUrl } from '@/server/storage/s3Upload'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { jsonError, jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { isApiError } from '@/server/api/http/apiError'

export async function handleGetPhotoPresignedUrl(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)

    const url = new URL(request.url)
    const contentType = url.searchParams.get('contentType') ?? 'image/jpeg'

    if (!contentType.startsWith('image/')) {
      return jsonError(400, 'INVALID_CONTENT_TYPE', 'Only image uploads are allowed')
    }

    const ext = contentType.split('/')[1] ?? 'jpg'
    const result = await generatePresignedUploadUrl(ext, contentType)

    return jsonOk(result)
  } catch (error) {
    if (isApiError(error)) return mapThrownErrorToResponse(error)
    console.error('Failed to generate presigned URL', error)
    return jsonError(500, 'SERVER_ERROR_GENERATING_PRESIGNED_URL')
  }
}
