import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

export type GenerateInLectureQuizUrlResult = {
  url: string
  /** True when `url` is the user's read-only submission view (already submitted). */
  alreadySubmitted: boolean
  /** Assess test token (fresh test only) — used to submit via `endassessment`. */
  token?: string
}
export type InLectureQuizGradedStatus = { graded: boolean }

/**
 * Generates an embeddable Assess Platform test URL for an in-lecture popup quiz.
 * Throws `ApiClientError` on failure so the modal can render an error state.
 */
export async function generateInLectureQuizUrl(input: {
  lectureId: number
  assessmentTemplateId: string
}): Promise<GenerateInLectureQuizUrlResult> {
  return fetchJson<GenerateInLectureQuizUrlResult>(
    LEARN_API.lectureQuizUrl(input.lectureId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentTemplateId: input.assessmentTemplateId,
      }),
    },
  )
}

/**
 * Polled by an open quiz modal to learn whether the Assess Platform has
 * graded (i.e. the student submitted) this attempt via its webhook callback.
 */
export async function checkInLectureQuizGraded(input: {
  lectureId: number
  assessmentTemplateId: string
}): Promise<InLectureQuizGradedStatus> {
  const params = new URLSearchParams({
    assessmentTemplateId: input.assessmentTemplateId,
  })
  return fetchJson<InLectureQuizGradedStatus>(
    `${LEARN_API.lectureQuizStatus(input.lectureId)}?${params.toString()}`,
  )
}

/**
 * Submits (ends) the user's in-lecture quiz attempt on the Assess Platform.
 * `token` is the fresh test token returned by {@link generateInLectureQuizUrl}.
 */
async function endInLectureQuizAssessment(input: {
  lectureId: number
  assessmentTemplateId: string
  token: string
}): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>(LEARN_API.lectureQuizSubmit(input.lectureId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessmentTemplateId: input.assessmentTemplateId,
      token: input.token,
    }),
  })
}
