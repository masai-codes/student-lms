import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  createAssessPlatformUrlViaExperienceApi,
  createSubmissionViaExperienceApi,
} from '@/server/assignments/services/experienceApiSubmissionActions'
import { getAssessPlatformSubmissionViewUrlForUser } from '@/server/assignments/services/getAssessPlatformSubmissionViewUrl'
import { updateSubmissionCompletionForUser } from '@/server/assignments/services/updateSubmissionCompletion'
import { isAssessmentPlatform } from '@/server/learn/utils/assignmentPlatform'

const AI_INTERVIEW_PLATFORM = 'assessment platform - ai interview'

function isAiInterviewPlatform(platform: string | null | undefined): boolean {
  return platform?.trim().toLowerCase() === AI_INTERVIEW_PLATFORM
}

export async function handleCreateAssignmentSubmission(
  assignmentIdParam: string,
): Promise<Response> {
  try {
    await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    const data = await createSubmissionViaExperienceApi(assignmentId)
    return jsonOk(data)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleCreateAssessPlatformUrl(
  request: Request,
  assignmentIdParam: string,
): Promise<Response> {
  try {
    await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    const body = (await request.json()) as {
      submissionId?: number
      platform?: string | null
    }

    if (!Number.isFinite(body.submissionId) || body.submissionId! <= 0) {
      return mapThrownErrorToResponse(new Error('INVALID_SUBMISSION_ID'))
    }

    const data = await createAssessPlatformUrlViaExperienceApi({
      assignmentId,
      submissionId: body.submissionId!,
      isAiInterview: isAiInterviewPlatform(body.platform ?? null),
    })

    return jsonOk(data)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleUpdateSubmissionCompletion(
  request: Request,
  submissionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const submissionId = parsePositiveIdParam(
      submissionIdParam,
      'INVALID_SUBMISSION_ID',
    )
    const body = (await request.json()) as { completed?: boolean }

    if (typeof body.completed !== 'boolean') {
      return mapThrownErrorToResponse(new Error('INVALID_SUBMISSION_PAYLOAD'))
    }

    await updateSubmissionCompletionForUser({
      userId,
      submissionId,
      completed: body.completed,
    })

    return jsonOk({ success: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleViewSubmissionOnAssessPlatform(
  submissionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const submissionId = parsePositiveIdParam(
      submissionIdParam,
      'INVALID_SUBMISSION_ID',
    )
    const url = await getAssessPlatformSubmissionViewUrlForUser({
      userId,
      submissionId,
    })
    return jsonOk({ url })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export function assignmentUsesAssessmentPlatform(
  platform: string | null,
): boolean {
  return isAssessmentPlatform(platform)
}
