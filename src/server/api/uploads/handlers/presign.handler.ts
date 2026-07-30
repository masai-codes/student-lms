import { z } from 'zod'

import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { S3_UPLOAD_SCOPES } from '@/lib/api/uploads/s3UploadScope'
import { generatePresignedPostPolicy } from '@/server/storage/s3Upload'

const presignBodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  scope: z.enum(S3_UPLOAD_SCOPES),
})

/** POST /api/uploads/presign — mint a presigned POST policy for direct S3 upload. */
export async function handlePresignUpload(request: Request): Promise<Response> {
  try {
    await requireSessionUserId()

    const body = presignBodySchema.parse(await request.json())
    const policy = await generatePresignedPostPolicy(body)

    return jsonOk({
      url: policy.url,
      bucketPath: policy.bucketPath,
      fields: policy.fields,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, 'INVALID_PRESIGN_PAYLOAD')
    }
    if (isApiError(error)) return mapThrownErrorToResponse(error)
    console.error('Failed to generate presigned POST policy', error)
    return jsonError(500, 'SERVER_ERROR_GENERATING_PRESIGNED_POST')
  }
}
