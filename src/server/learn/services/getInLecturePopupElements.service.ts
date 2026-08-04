import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { zefLmsMetaData, zefLmsPollsQuestions, zefLmsQuiz } from '@/db/schema'
import type { InLecturePopupElements } from '@/server/learn/lectureDetailTypes'

/**
 * Convert an element's absolute (offset-stamped ISO) timestamp into a
 * video-relative offset in whole seconds, measured from `referenceMs`
 * (the meta row's `scheduledAt`, i.e. video t=0). Returns `null` when the
 * timestamp is missing or unparseable so the caller can drop the element.
 */
function toOffsetSec(
  timestamp: string | null,
  referenceMs: number,
): number | null {
  if (!timestamp) return null
  const ms = new Date(timestamp).getTime()
  if (!Number.isFinite(ms)) return null
  return Math.round((ms - referenceMs) / 1000)
}

/**
 * In-lecture popup elements (quizzes + polls) for a lecture, sourced from the
 * ZEF ⇆ LMS tables rather than `lectures.settings`.
 *
 * `zef_lms_meta_data` is unique per `lecture_id`, so a lecture has at most one
 * meta row. When there is no meta row the lecture has no configured elements and
 * we return empties. Otherwise the quizzes and polls hang off `meta.id`.
 *
 * Each element's absolute start/end timestamps are converted here into the
 * video-relative window (`startSec` / `endSec`) using the meta row's
 * `scheduledAt` as video t=0. Elements are dropped when they can't be placed —
 * no `scheduledAt` reference, or a missing/unparseable timestamp. Remaining
 * window validation (start < end, clamp to the real video duration, ordering)
 * stays client-side, where the loaded video's duration is known.
 */
export async function getInLecturePopupElements(
  lectureId: number,
): Promise<InLecturePopupElements> {
  const metaRows = await db
    .select({
      id: zefLmsMetaData.id,
      lectureId: zefLmsMetaData.lectureId,
      scheduledAt: zefLmsMetaData.scheduledAt,
      source: zefLmsMetaData.source,
      createdAt: zefLmsMetaData.createdAt,
      updatedAt: zefLmsMetaData.updatedAt,
    })
    .from(zefLmsMetaData)
    .where(eq(zefLmsMetaData.lectureId, lectureId))
    .limit(1)

  const meta = metaRows[0]
  if (!meta) return { metaData: null, quiz: [], polls: [] }

  const metaData = {
    id: meta.id,
    lectureId: meta.lectureId,
    scheduledAt: meta.scheduledAt ?? null,
    source: meta.source,
    createdAt: meta.createdAt ?? null,
    updatedAt: meta.updatedAt ?? null,
  }

  // Without a `scheduledAt` reference we can't place any element on the video
  // timeline, so surface the meta row but no elements.
  const referenceMs = meta.scheduledAt
    ? new Date(meta.scheduledAt).getTime()
    : NaN
  if (!Number.isFinite(referenceMs)) {
    return { metaData, quiz: [], polls: [] }
  }

  const [quizRows, pollRows] = await Promise.all([
    db
      .select({
        id: zefLmsQuiz.id,
        assessmentId: zefLmsQuiz.assessmentId,
        status: zefLmsQuiz.status,
        startTimestamp: zefLmsQuiz.startTimestamp,
        endTimestamp: zefLmsQuiz.endTimestamp,
      })
      .from(zefLmsQuiz)
      .where(
        and(
          eq(zefLmsQuiz.zefLmsMetaDataId, meta.id),
          eq(zefLmsQuiz.status, 'active'),
        ),
      ),
    db
      .select({
        id: zefLmsPollsQuestions.id,
        question: zefLmsPollsQuestions.question,
        options: zefLmsPollsQuestions.options,
        status: zefLmsPollsQuestions.status,
        startTimestamp: zefLmsPollsQuestions.startTimestamp,
        endTimestamp: zefLmsPollsQuestions.endTimestamp,
      })
      .from(zefLmsPollsQuestions)
      .where(
        and(
          eq(zefLmsPollsQuestions.zefLmsMetaDataId, meta.id),
          eq(zefLmsPollsQuestions.status, 'active'),
        ),
      ),
  ])

  return {
    metaData,
    quiz: quizRows.flatMap((row) => {
      const startSec = toOffsetSec(row.startTimestamp, referenceMs)
      const endSec = toOffsetSec(row.endTimestamp, referenceMs)
      if (startSec === null || endSec === null) return []
      return [
        {
          id: row.id,
          assessmentId: row.assessmentId,
          status: row.status,
          startSec,
          endSec,
        },
      ]
    }),
    polls: pollRows.flatMap((row) => {
      const startSec = toOffsetSec(row.startTimestamp, referenceMs)
      const endSec = toOffsetSec(row.endTimestamp, referenceMs)
      if (startSec === null || endSec === null) return []
      return [
        {
          id: row.id,
          question: row.question,
          options: row.options,
          status: row.status,
          startSec,
          endSec,
        },
      ]
    }),
  }
}
