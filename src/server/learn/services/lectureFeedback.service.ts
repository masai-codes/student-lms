import { and, eq, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { lectureFeedback, lectures } from '@/db/schema'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'
import { resolveLectureFeedbackWindow } from '@/server/learn/utils/resolveLectureFeedbackWindow'

const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

export type LectureFeedbackRecord = {
  rating: number | null
  text: string | null
}

/** The current user's saved feedback for a lecture, or nulls when none exists. */
export async function getLectureFeedbackRecord(
  userId: number,
  lectureId: number,
): Promise<LectureFeedbackRecord> {
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
  if (!row) return { rating: null, text: null }
  return { rating: row.rating > 0 ? row.rating : null, text: row.feedback ?? null }
}

/** Create or update the user's feedback row for a lecture (idempotent upsert). */
export async function upsertLectureFeedback(input: {
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
 * Save the user's feedback for a lecture, enforcing access + the submission
 * window server-side. Throws `LEARN_DETAIL_NOT_FOUND` / `FEEDBACK_WINDOW_CLOSED`.
 */
export async function submitLectureFeedback(input: {
  userId: number
  lectureId: number
  rating: number
  text: string | null
}): Promise<LectureFeedbackRecord> {
  const rows = await db
    .select({
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      settings: lectures.settings,
      batchId: lectures.batchId,
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
    lecture.batchId,
    lecture.sectionId,
  )
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
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

  await upsertLectureFeedback(input)
  return { rating: input.rating, text: input.text }
}
