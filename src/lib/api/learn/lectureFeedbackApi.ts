import type { LectureFeedbackState } from '@/server/learn/lectureDetailTypes'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

export type SubmitLectureFeedbackResult = Pick<
  LectureFeedbackState,
  'rating' | 'text' | 'tags'
>

export async function submitLectureFeedbackViaApi(input: {
  lectureId: number
  rating: number
  feedback?: string
  tags?: Array<string>
}): Promise<SubmitLectureFeedbackResult> {
  try {
    return await fetchJson<SubmitLectureFeedbackResult>(
      LEARN_API.lectureFeedback(input.lectureId),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: input.rating,
          feedback: input.feedback,
          tags: input.tags,
        }),
      },
    )
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}
