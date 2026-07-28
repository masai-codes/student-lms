import { and, eq, isNull, ne } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, lectures, lecturesAi, lectureZoomChat } from '@/db/schema'
import { isSupportedAssignmentDetailType } from '@/server/learn/utils/buildAssignmentDetailPayload'
import { isSupportedLectureDetailType } from '@/server/learn/utils/buildLectureDetailPayload'
import { appendZoomChatToNotes } from '@/server/learn/utils/appendZoomChatToNotes'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { isSupportedResourceLectureType } from '@/server/learn/utils/normalizeResourceKind'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

type LectureAccessRow = {
  notes: string | null
  type: string
  sectionId: number | null
}

async function loadAccessibleLecture(
  userId: number,
  lectureId: number,
): Promise<LectureAccessRow> {
  const rows = await db
    .select({
      notes: lectures.notes,
      type: lectures.type,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        ne(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]
  if (!isSupportedLectureDetailType(row.type)) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  return row
}

/** Lecture notes + Zoom-chat "Resources shared" links (same as detail tabs). */
export async function fetchLectureNotesForUser(
  userId: number,
  lectureId: number,
): Promise<string | null> {
  const row = await loadAccessibleLecture(userId, lectureId)
  const zoomChatRows = await db
    .select({ finalChat: lectureZoomChat.finalChat })
    .from(lectureZoomChat)
    .where(eq(lectureZoomChat.lectureId, lectureId))
    .limit(1)

  return appendZoomChatToNotes(row.notes, zoomChatRows[0]?.finalChat ?? null)
}

/** AI summary from `lectures_ai.summary`, normalized like the detail tabs. */
export async function fetchLectureSummaryForUser(
  userId: number,
  lectureId: number,
): Promise<string | null> {
  await loadAccessibleLecture(userId, lectureId)
  const aiRows = await db
    .select({ summary: lecturesAi.summary })
    .from(lecturesAi)
    .where(eq(lecturesAi.lectureId, lectureId))
    .limit(1)

  return normalizeNullableText(aiRows[0]?.summary ?? null)
}

/** Reading-resource body: `notes ?? description` (same as ResourceDetailPayload.body). */
export async function fetchResourceBodyForUser(
  userId: number,
  resourceId: number,
): Promise<string | null> {
  const rows = await db
    .select({
      notes: lectures.notes,
      description: lectures.description,
      type: lectures.type,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, resourceId),
        isNull(lectures.deletedAt),
        eq(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]
  if (!isSupportedResourceLectureType(row.type)) {
    throw new Error('RESOURCE_DETAIL_UNSUPPORTED_TYPE')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  return (
    normalizeNullableText(row.notes) ?? normalizeNullableText(row.description)
  )
}

/** Assignment instructions (trimmed), matching AssignmentDetailPayload.instructions. */
export async function fetchAssignmentInstructionsForUser(
  userId: number,
  assignmentId: number,
): Promise<string | null> {
  const rows = await db
    .select({
      instructions: assignments.instructions,
      type: assignments.type,
      sectionId: assignments.sectionId,
    })
    .from(assignments)
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]
  if (!isSupportedAssignmentDetailType(row.type)) {
    throw new Error('ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  return normalizeNullableText(row.instructions)
}
