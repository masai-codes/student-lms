import { buildInLectureQuizUniqueId } from '@/server/learn/utils/inLectureQuizUniqueId'
import { isInLectureQuizGraded } from '@/server/learn/services/inLectureQuizGradedStore'

/**
 * Polled by an open in-lecture quiz modal to learn whether the Assess
 * Platform has graded (i.e. the student submitted) this attempt yet. Only
 * session-gated — no lecture/section-membership check — since it returns
 * nothing beyond a boolean and is hit on a short interval.
 */
export async function getInLectureQuizGradedStatus(input: {
  userId: number
  lectureId: number
  assessmentTemplateId: string
}): Promise<{ graded: boolean }> {
  const uniqueId = buildInLectureQuizUniqueId(
    input.userId,
    input.lectureId,
    input.assessmentTemplateId,
  )
  const graded = await isInLectureQuizGraded(uniqueId)
  return { graded }
}
