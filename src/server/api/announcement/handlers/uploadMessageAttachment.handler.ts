import { randomUUID } from 'node:crypto'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { uploadImageToS3 } from '@/server/storage/s3Upload'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function handleUploadMessageAttachment(
  request: Request,
): Promise<Response> {
  await requireSessionUserId()

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new ApiError(400, 'NO_FILE')

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.length === 0) throw new ApiError(400, 'NO_FILE')
  if (buffer.length > MAX_BYTES) throw new ApiError(400, 'FILE_TOO_LARGE')

  const contentType = file.type || 'application/octet-stream'
  const ext = file.name.includes('.')
    ? (file.name.split('.').pop() ?? 'bin')
    : (contentType.split('/')[1] ?? 'bin')

  const url = await uploadImageToS3({
    buffer,
    contentType,
    ext,
    keyPrefix: `dev/lms/tickets/${randomUUID()}`,
  })

  return jsonOk({ url, name: file.name || 'attachment' }, { status: 201 })
}
