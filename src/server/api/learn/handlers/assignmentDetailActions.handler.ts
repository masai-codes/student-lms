import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  createAssessPlatformAiInterviewUrl,
  createAssessPlatformUrl,
} from '@/server/assignments/services/createAssessPlatformUrl'
import { createAssignmentSubmission } from '@/server/assignments/services/createAssignmentSubmission'
import { getAssessPlatformSubmissionViewUrlForUser } from '@/server/assignments/services/getAssessPlatformSubmissionViewUrl'
import { markSubmissionCompletedWithToken } from '@/server/assignments/services/markSubmissionCompletedWithToken'
import { updateSubmissionCompletionForUser } from '@/server/assignments/services/updateSubmissionCompletion'

const AI_INTERVIEW_PLATFORM = 'assessment platform - ai interview'

function isAiInterviewPlatform(platform: string | null | undefined): boolean {
  return platform?.trim().toLowerCase() === AI_INTERVIEW_PLATFORM
}

export async function handleCreateAssignmentSubmission(
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    const data = await createAssignmentSubmission({ assignmentId, userId })
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
    const userId = await requireSessionUserId()
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

    const params = {
      assignmentId,
      submissionId: body.submissionId!,
      userId,
    }
    const data = isAiInterviewPlatform(body.platform ?? null)
      ? await createAssessPlatformAiInterviewUrl(params)
      : await createAssessPlatformUrl(params)

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

export async function handleMarkSubmissionCompletedWithToken(
  request: Request,
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    const body = (await request.json()) as { token?: string }

    const data = await markSubmissionCompletedWithToken({
      userId,
      assignmentId,
      token: typeof body.token === 'string' ? body.token : '',
    })

    return jsonOk(data)
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
