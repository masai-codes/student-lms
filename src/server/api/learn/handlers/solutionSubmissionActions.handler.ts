import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { submitSolutionForUser } from '@/server/assignments/services/submitSolution.service'
import { uploadImageToS3 } from '@/server/storage/s3Upload'
import { isValidSubmissionUrl } from '@/lib/learn/isValidSubmissionUrl'

/** Max solution-file upload size (25 MB). */
const MAX_BYTES = 25 * 1024 * 1024

/** PATCH /api/learn/solutions/:solutionId — submit a LINK solution. */
export async function handleSubmitSolutionLink(
  request: Request,
  solutionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const solutionId = parsePositiveIdParam(
      solutionIdParam,
      'INVALID_SOLUTION_ID',
    )
    const body = (await request.json().catch(() => ({}))) as {
      submissionLink?: unknown
    }
    const submissionLink =
      typeof body.submissionLink === 'string' ? body.submissionLink.trim() : ''
    if (!isValidSubmissionUrl(submissionLink)) {
      throw new ApiError(400, 'INVALID_SOLUTION_PAYLOAD')
    }
    const data = await submitSolutionForUser({
      userId,
      solutionId,
      submissionLink,
    })
    return jsonOk(data)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

/** POST /api/learn/solutions/:solutionId/file — upload + submit a FILE solution. */
export async function handleUploadSolutionFile(
  request: Request,
  solutionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const solutionId = parsePositiveIdParam(
      solutionIdParam,
      'INVALID_SOLUTION_ID',
    )

    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) {
      throw new ApiError(400, 'SOLUTION_UPLOAD_NO_FILE')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) throw new ApiError(400, 'SOLUTION_UPLOAD_NO_FILE')
    if (buffer.length > MAX_BYTES)
      throw new ApiError(400, 'SOLUTION_UPLOAD_TOO_LARGE')

    const contentType = file.type || 'application/octet-stream'
    const ext = file.name.includes('.')
      ? (file.name.split('.').pop() ?? 'bin')
      : (contentType.split('/')[1] ?? 'bin')

    const submissionLink = await uploadImageToS3({ buffer, contentType, ext })
    const data = await submitSolutionForUser({
      userId,
      solutionId,
      submissionLink,
    })
    return jsonOk(data)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
