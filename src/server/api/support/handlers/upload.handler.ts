/**
 * Support handler — POST /api/support/upload
 *
 * Accepts a single multipart `file` (the ticket attachment), stores it on S3 and
 * returns its public URL + original name. The composer uploads each file then
 * embeds `[name](url)` into the message — mirroring the legacy attachment flow.
 */

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { uploadImageToS3 } from '@/server/storage/s3Upload'
import { mapSupportError } from '@/server/api/support/http'

/** Max attachment size (10 MB), matching the image-upload limit. */
const MAX_BYTES = 10 * 1024 * 1024

export async function handleUploadAttachment(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)

    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) throw new ApiError(400, 'SUPPORT_UPLOAD_NO_FILE')

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) throw new ApiError(400, 'SUPPORT_UPLOAD_NO_FILE')
    if (buffer.length > MAX_BYTES) throw new ApiError(400, 'SUPPORT_UPLOAD_TOO_LARGE')

    const contentType = file.type || 'application/octet-stream'
    const ext = file.name.includes('.')
      ? (file.name.split('.').pop() ?? 'bin')
      : (contentType.split('/')[1] ?? 'bin')

    const url = await uploadImageToS3({ buffer, contentType, ext })
    return jsonOk({ url, name: file.name || 'attachment' }, { status: 201 })
  } catch (error) {
    return mapSupportError(error)
  }
}
