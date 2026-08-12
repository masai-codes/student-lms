import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getInLecturePollSubmission } from '@/server/learn/services/getInLecturePollSubmission.service'

export async function handleGetInLecturePollSubmission(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const pollIdParam = new URL(request.url).searchParams.get('pollId')
    if (!pollIdParam) {
      throw new ApiError(400, 'POLL_ID_REQUIRED')
    }
    const pollId = parsePositiveIdParam(pollIdParam, 'INVALID_POLL_ID')

    const result = await getInLecturePollSubmission({
      userId,
      lectureId,
      pollId,
    })
    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
