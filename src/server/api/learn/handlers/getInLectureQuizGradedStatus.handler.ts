import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getInLectureQuizGradedStatus } from '@/server/learn/services/getInLectureQuizGradedStatus.service'

export async function handleGetInLectureQuizGradedStatus(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const assessmentTemplateId = new URL(request.url).searchParams.get(
      'assessmentTemplateId',
    )
    if (!assessmentTemplateId) {
      throw new ApiError(400, 'ASSESSMENT_TEMPLATE_ID_REQUIRED')
    }

    const result = await getInLectureQuizGradedStatus({
      userId,
      lectureId,
      assessmentTemplateId,
    })
    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
