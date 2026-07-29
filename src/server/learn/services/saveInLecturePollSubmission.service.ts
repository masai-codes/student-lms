import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { lectures, zefLmsMetaData, zefLmsPollsQuestions, zefLmsPollsSubmissions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import {
  computeInLecturePollResults,
  type InLecturePollResults,
} from '@/server/learn/utils/inLecturePollResults'

/**
 * Persists the user's response to an in-lecture popup poll into
 * `zef_lms_polls_submissions` (one row per poll+user; a repeat submit
 * overwrites it in place — the client itself disables resubmission once a row
 * exists, so this only guards against duplicate in-flight requests).
 *
 * `selectedOptionIndex` is validated against the poll's own `options` list so
 * a student can't record an out-of-range answer. Returns the freshly
 * recomputed aggregate results (including this submission) so the modal can
 * render percentages immediately without a second round trip.
 */
export async function saveInLecturePollSubmission(input: {
  userId: number
  lectureId: number
  pollId: number
  selectedOptionIndex: number
}): Promise<{
  submitted: true
  selectedOptionIndex: number
  results: InLecturePollResults
}> {
  const { userId, lectureId, pollId, selectedOptionIndex } = input

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
    .select({ options: zefLmsPollsQuestions.options })
    .from(zefLmsPollsQuestions)
    .innerJoin(
      zefLmsMetaData,
      eq(zefLmsPollsQuestions.zefLmsMetaDataId, zefLmsMetaData.id),
    )
    .where(
      and(
        eq(zefLmsMetaData.lectureId, lectureId),
        eq(zefLmsPollsQuestions.id, pollId),
        eq(zefLmsPollsQuestions.status, 'active'),
      ),
    )
    .limit(1)
  const poll = pollRows[0]
  if (!poll) throw new ApiError(404, 'POLL_NOT_FOUND')

  const optionCount = Array.isArray(poll.options) ? poll.options.length : 0
  if (selectedOptionIndex < 0 || selectedOptionIndex >= optionCount) {
    throw new ApiError(400, 'INVALID_POLL_OPTION_INDEX')
  }

  const nowUtc = new Date().toISOString()

  await db
    .insert(zefLmsPollsSubmissions)
    .values({
      zefLmsPollsQuestionsId: pollId,
      userId,
      selectedOptionIndex,
      submittedAt: nowUtc,
      createdAt: nowUtc,
    })
    .onDuplicateKeyUpdate({
      set: {
        selectedOptionIndex,
        submittedAt: nowUtc,
        updatedAt: nowUtc,
      },
    })

  const results = await computeInLecturePollResults(pollId, optionCount)
  return { submitted: true, selectedOptionIndex, results }
}
