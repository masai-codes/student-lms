import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import {
  lectures,
  zefLmsMetaData,
  zefLmsPollsQuestions,
  zefLmsPollsSubmissions,
} from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import {
  computeInLecturePollResults,
  type InLecturePollResults,
} from '@/server/learn/utils/inLecturePollResults'

/**
 * Looks up the current user's saved response (if any) for an in-lecture popup
 * poll, keying off `zef_lms_polls_submissions`. Mirrors
 * `getInLectureQuizGradedStatus` — the DB row is the single source of truth
 * for "already attempted", so the modal can restore the read-only state on
 * revisit. When a submission exists, also returns the aggregate results
 * (per-option response counts) so the modal can show percentages — withheld
 * while unsubmitted so a student can't see the distribution before answering.
 */
export async function getInLecturePollSubmission(input: {
  userId: number
  lectureId: number
  pollId: number
}): Promise<{
  submitted: boolean
  selectedOptionIndex: number | null
  results: InLecturePollResults | null
}> {
  const { userId, lectureId, pollId } = input

  const lectureRows = await db
    .select({ sectionId: lectures.sectionId })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)
  const lecture = lectureRows[0]
  if (!lecture) throw new ApiError(404, 'LECTURE_NOT_FOUND')

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    lecture.sectionId,
  )
  if (!allowed) throw new ApiError(404, 'LECTURE_NOT_FOUND')

  const pollRows = await db
    .select({
      id: zefLmsPollsQuestions.id,
      options: zefLmsPollsQuestions.options,
    })
    .from(zefLmsPollsQuestions)
    .innerJoin(
      zefLmsMetaData,
      eq(zefLmsPollsQuestions.zefLmsMetaDataId, zefLmsMetaData.id),
    )
    .where(
      and(
        eq(zefLmsMetaData.lectureId, lectureId),
        eq(zefLmsPollsQuestions.id, pollId),
      ),
    )
    .limit(1)
  const poll = pollRows[0]
  if (!poll) throw new ApiError(404, 'POLL_NOT_FOUND')

  const submissionRows = await db
    .select({
      selectedOptionIndex: zefLmsPollsSubmissions.selectedOptionIndex,
    })
    .from(zefLmsPollsSubmissions)
    .where(
      and(
        eq(zefLmsPollsSubmissions.zefLmsPollsQuestionsId, pollId),
        eq(zefLmsPollsSubmissions.userId, userId),
      ),
    )
    .limit(1)

  const submission = submissionRows[0]
  if (!submission)
    return { submitted: false, selectedOptionIndex: null, results: null }

  const optionCount = Array.isArray(poll.options) ? poll.options.length : 0
  const results = await computeInLecturePollResults(pollId, optionCount)
  return {
    submitted: true,
    selectedOptionIndex: submission.selectedOptionIndex,
    results,
  }
}
