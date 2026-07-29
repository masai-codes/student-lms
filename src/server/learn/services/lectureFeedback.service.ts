import { and, eq, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import {
  lectureFeedback,
  lectures,
  studentAttendances,
  zefLmsFeedbackSubmissions,
  zefLmsMetaData,
} from '@/db/schema'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'
import { resolveLectureFeedbackWindow } from '@/server/learn/utils/resolveLectureFeedbackWindow'

const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

export type LectureFeedbackRecord = {
  /**
   * Which flow this lecture uses, decided purely by whether it has a
   * `zef_lms_meta_data` row: `'zef'` (tagged feedback, no submission window,
   * `zef_lms_feedback_submissions`) or `'legacy'` (the original rating+text
   * flow, window-gated, `lecture_feedback`).
   */
  mode: 'zef' | 'legacy'
  rating: number | null
  text: string | null
  tags: Array<string>
}

function normalizeTags(value: unknown): Array<string> {
  if (!Array.isArray(value)) return []
  return value.filter((tag): tag is string => typeof tag === 'string')
}

async function findZefLmsMetaDataId(lectureId: number): Promise<number | null> {
  const rows = await db
    .select({ id: zefLmsMetaData.id })
    .from(zefLmsMetaData)
    .where(eq(zefLmsMetaData.lectureId, lectureId))
    .limit(1)
  return rows.at(0)?.id ?? null
}

async function hasAttendedLecture(
  userId: number,
  lectureId: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: studentAttendances.id })
    .from(studentAttendances)
    .where(
      and(
        eq(studentAttendances.lectureId, lectureId),
        eq(studentAttendances.userId, userId),
        eq(studentAttendances.status, 1),
      ),
    )
    .limit(1)
  return rows.length > 0
}

/**
 * `zef` mode requires both a `zef_lms_meta_data` row for the lecture *and*
 * the user having attended it (`student_attendances.status = 1`). Either
 * missing falls back to `legacy`. Returns the meta row id when eligible.
 *
 * Used only by `submitLectureFeedback` — a fresh POST has no pre-fetched
 * attendance to reuse, unlike `getLectureFeedbackRecord` (see its docstring).
 */
async function resolveZefLmsMetaDataId(
  userId: number,
  lectureId: number,
): Promise<number | null> {
  const zefLmsMetaDataId = await findZefLmsMetaDataId(lectureId)
  if (zefLmsMetaDataId == null) return null

  const attended = await hasAttendedLecture(userId, lectureId)
  if (!attended) return null

  return zefLmsMetaDataId
}

/**
 * The current user's saved feedback for a lecture.
 *
 * Picks between two independent flows: `zef` mode requires both a
 * `zef_lms_meta_data` row for the lecture and the user having attended it —
 * otherwise falls back to `legacy` (see `submitLectureFeedback` for why).
 *
 * `attended` is passed in by the caller rather than queried here: the lecture
 * detail page already fetches `student_attendances` once (via
 * `fetchLectureAttendanceSummaries`, `overallStatus === 1`) to render the
 * "Present" badge, so reusing that value keeps the two in lockstep instead of
 * running a second, independent read of the same row.
 */
export async function getLectureFeedbackRecord(
  userId: number,
  lectureId: number,
  attended: boolean,
): Promise<LectureFeedbackRecord> {
  const zefLmsMetaDataId = attended ? await findZefLmsMetaDataId(lectureId) : null

  if (zefLmsMetaDataId != null) {
    const rows = await db
      .select({
        rating: zefLmsFeedbackSubmissions.rating,
        message: zefLmsFeedbackSubmissions.message,
        followupTags: zefLmsFeedbackSubmissions.followupTags,
      })
      .from(zefLmsFeedbackSubmissions)
      .where(
        and(
          eq(zefLmsFeedbackSubmissions.zefLmsMetaDataId, zefLmsMetaDataId),
          eq(zefLmsFeedbackSubmissions.userId, userId),
        ),
      )
      .limit(1)

    const row = rows.at(0)
    return {
      mode: 'zef',
      rating: row && row.rating > 0 ? row.rating : null,
      text: row?.message ?? null,
      tags: normalizeTags(row?.followupTags),
    }
  }

  const rows = await db
    .select({ rating: lectureFeedback.rating, feedback: lectureFeedback.feedback })
    .from(lectureFeedback)
    .where(
      and(
        eq(lectureFeedback.lectureId, lectureId),
        eq(lectureFeedback.userId, userId),
      ),
    )
    .limit(1)

  const row = rows.at(0)
  return {
    mode: 'legacy',
    rating: row && row.rating > 0 ? row.rating : null,
    text: row?.feedback ?? null,
    tags: [],
  }
}

async function upsertZefLectureFeedback(input: {
  zefLmsMetaDataId: number
  userId: number
  rating: number
  text: string | null
  tags: Array<string>
}): Promise<void> {
  const nowUtc = new Date().toISOString()
  await db
    .insert(zefLmsFeedbackSubmissions)
    .values({
      zefLmsMetaDataId: input.zefLmsMetaDataId,
      userId: input.userId,
      rating: input.rating,
      message: input.text,
      followupTags: input.tags,
      source: 'lms',
      submittedAt: nowUtc,
      createdAt: nowUtc,
    })
    .onDuplicateKeyUpdate({
      set: {
        rating: input.rating,
        message: input.text,
        followupTags: input.tags,
        submittedAt: nowUtc,
        updatedAt: nowUtc,
      },
    })
}

async function upsertLegacyLectureFeedback(input: {
  userId: number
  lectureId: number
  rating: number
  text: string | null
}): Promise<void> {
  const existing = await db
    .select({ id: lectureFeedback.id })
    .from(lectureFeedback)
    .where(
      and(
        eq(lectureFeedback.lectureId, input.lectureId),
        eq(lectureFeedback.userId, input.userId),
      ),
    )
    .limit(1)

  const current = existing.at(0)
  if (current) {
    await db
      .update(lectureFeedback)
      .set({ rating: input.rating, feedback: input.text, updatedAt: NOW_IST })
      .where(eq(lectureFeedback.id, current.id))
    return
  }

  await db.insert(lectureFeedback).values({
    lectureId: input.lectureId,
    userId: input.userId,
    rating: input.rating,
    feedback: input.text,
    createdAt: NOW_IST,
    updatedAt: NOW_IST,
  })
}

/**
 * Save the user's feedback for a lecture.
 *
 * `zef` mode (a `zef_lms_meta_data` row exists for the lecture *and* the
 * user attended it — `student_attendances.status = 1`): no gating beyond
 * auth/access — rating + tags + text can be submitted any time, saved to
 * `zef_lms_feedback_submissions`.
 *
 * `legacy` mode (meta row missing, or the user didn't attend): the original
 * behaviour — rating + text only (no tags), gated by the schedule/conclude
 * submission window, saved to `lecture_feedback`. Throws
 * `LEARN_DETAIL_NOT_FOUND` / `FEEDBACK_WINDOW_CLOSED`.
 */
export async function submitLectureFeedback(input: {
  userId: number
  lectureId: number
  rating: number
  text: string | null
  tags: Array<string>
}): Promise<LectureFeedbackRecord> {
  const rows = await db
    .select({
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      settings: lectures.settings,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(and(eq(lectures.id, input.lectureId), isNull(lectures.deletedAt)))
    .limit(1)

  const lecture = rows.at(0)
  if (!lecture) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    input.userId,
    lecture.sectionId,
  )
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const zefLmsMetaDataId = await resolveZefLmsMetaDataId(
    input.userId,
    input.lectureId,
  )

  if (zefLmsMetaDataId != null) {
    await upsertZefLectureFeedback({
      zefLmsMetaDataId,
      userId: input.userId,
      rating: input.rating,
      text: input.text,
      tags: input.tags,
    })
    return {
      mode: 'zef',
      rating: input.rating,
      text: input.text,
      tags: input.tags,
    }
  }

  const isOpen = resolveLectureFeedbackWindow({
    schedule: lecture.schedule,
    concludes: lecture.concludes,
    nowMs: Date.now(),
    showFeedback: parseLectureSettings(lecture.settings).showFeedback,
  })
  if (!isOpen) {
    throw new Error('FEEDBACK_WINDOW_CLOSED')
  }

  await upsertLegacyLectureFeedback({
    userId: input.userId,
    lectureId: input.lectureId,
    rating: input.rating,
    text: input.text,
  })
  return { mode: 'legacy', rating: input.rating, text: input.text, tags: [] }
}
