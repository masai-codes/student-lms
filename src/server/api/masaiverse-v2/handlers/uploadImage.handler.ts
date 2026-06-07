import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { uploadImageToS3 } from '@/server/storage/s3Upload'

/** Max image upload size (5 MB). */
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Accepts a multipart form upload (`file` field), validates it's an image
 * within the size limit, stores it on S3 and returns its public URL. Requires a
 * signed-in user; reusable for any image upload.
 */
export async function handleUploadImage(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)

    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) throw new ApiError(400, 'UPLOAD_NO_FILE')

    const contentType = file.type
    if (!contentType.startsWith('image/')) {
      throw new ApiError(400, 'UPLOAD_INVALID_FILE_TYPE')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) throw new ApiError(400, 'UPLOAD_NO_FILE')
    if (buffer.length > MAX_BYTES) throw new ApiError(400, 'UPLOAD_FILE_TOO_LARGE')

    const ext = file.name.includes('.')
      ? (file.name.split('.').pop() ?? '')
      : contentType.split('/')[1] ?? 'png'

    const url = await uploadImageToS3({ buffer, contentType, ext })
    return jsonOk({ url }, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to upload image', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_UPLOADING_IMAGE'))
    }
    return mapThrownErrorToResponse(error)
  }
}
