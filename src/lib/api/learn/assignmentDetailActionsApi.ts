import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'

async function postLearnApi<T>(path: string, body: unknown): Promise<T> {
  try {
    return await fetchJson<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message || error.code)
    }
    throw error
  }
}

async function patchLearnApi<T>(path: string, body: unknown): Promise<T> {
  try {
    return await fetchJson<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message || error.code)
    }
    throw error
  }
}

export function createAssignmentSubmission(assignmentId: number) {
  return postLearnApi<{ id: number }>(
    `/api/learn/assignments/${assignmentId}/submissions`,
    {},
  )
}

export function createAssessPlatformUrl(input: {
  assignmentId: number
  submissionId: number
  platform: string | null
}) {
  return postLearnApi<{ url: string }>(
    `/api/learn/assignments/${input.assignmentId}/assess-platform-url`,
    {
      submissionId: input.submissionId,
      platform: input.platform,
    },
  )
}

export function markSubmissionCompletedWithToken(
  assignmentId: number,
  token: string,
) {
  return postLearnApi<{ markAsCompleted: boolean }>(
    `/api/learn/assignments/${assignmentId}/mark-completed-with-token`,
    { token },
  )
}

export function updateSubmissionCompletion(input: {
  submissionId: number
  completed: boolean
}) {
  return patchLearnApi<{ success: boolean }>(
    `/api/learn/submissions/${input.submissionId}`,
    { completed: input.completed },
  )
}

export function fetchAssessPlatformViewUrl(submissionId: number) {
  return postLearnApi<{ url: string }>(
    `/api/learn/submissions/${submissionId}/view-on-platform`,
    {},
  )
}

export type SubmitSolutionResult = { status: string; submissionLink: string }

export function submitSolutionLink(solutionId: number, submissionLink: string) {
  return patchLearnApi<SubmitSolutionResult>(
    `/api/learn/solutions/${solutionId}`,
    { submissionLink },
  )
}

export async function uploadSolutionFile(
  solutionId: number,
  file: File,
): Promise<SubmitSolutionResult> {
  const body = new FormData()
  body.append('file', file)
  try {
    return await fetchJson<SubmitSolutionResult>(
      `/api/learn/solutions/${solutionId}/file`,
      { method: 'POST', body },
    )
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message || error.code)
    }
    throw error
  }
}
