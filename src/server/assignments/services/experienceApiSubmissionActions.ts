import { experienceApiFetch } from '@/server/api/http/experienceApiFetch'

type ExperienceApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
}

async function parseExperienceApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ExperienceApiEnvelope<T>

  if (!response.ok || body.success === false) {
    throw new Error(body.message ?? 'EXPERIENCE_API_REQUEST_FAILED')
  }

  if (body.data === undefined) {
    throw new Error('EXPERIENCE_API_EMPTY_RESPONSE')
  }

  return body.data
}

export async function createSubmissionViaExperienceApi(
  assignmentId: number,
): Promise<{ id: number }> {
  const response = await experienceApiFetch(`/submissions/${assignmentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = await parseExperienceApiResponse<{ id: number | string }>(response)
  return { id: Number(data.id) }
}

export async function createAssessPlatformUrlViaExperienceApi(input: {
  assignmentId: number
  submissionId: number
  isAiInterview: boolean
}): Promise<{ url: string }> {
  const path = input.isAiInterview
    ? `/assignments/${input.assignmentId}/ai-interview-url`
    : `/assignments/${input.assignmentId}/assess-platform-url`

  const response = await experienceApiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: input.submissionId }),
  })

  return parseExperienceApiResponse<{ url: string }>(response)
}
