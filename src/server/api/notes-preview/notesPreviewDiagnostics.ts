import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { lectures } from '@/db/schema'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

type LectureProbeRow = {
  id: number
  type: string
  sectionId: number | null
  deletedAt: string | null
}

async function probeLectureById(
  lectureId: number,
): Promise<LectureProbeRow | null> {
  const rows = await db
    .select({
      id: lectures.id,
      type: lectures.type,
      sectionId: lectures.sectionId,
      deletedAt: lectures.deletedAt,
    })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)
  return rows[0] ?? null
}

function lectureMismatchReason(probe: LectureProbeRow | null): string {
  if (probe == null) return 'no_row'
  if (probe.deletedAt != null) return 'soft_deleted'
  if (probe.type === LECTURE_RESOURCE_TYPE) {
    return 'is_reading_resource_use_category_resource'
  }
  return 'unknown'
}

function resourceMismatchReason(probe: LectureProbeRow | null): string {
  if (probe == null) return 'no_row'
  if (probe.deletedAt != null) return 'soft_deleted'
  if (probe.type !== LECTURE_RESOURCE_TYPE) {
    return 'wrong_type_use_category_lecture'
  }
  return 'unknown'
}

/** Logs why a lecture-category lookup failed (missing / deleted / wrong type). */
export async function warnLectureRowNotMatched(
  userId: number,
  lectureId: number,
): Promise<void> {
  const probe = await probeLectureById(lectureId)
  console.warn('[notes-preview] lecture row not matched', {
    userId,
    lectureId,
    required: `type != ${LECTURE_RESOURCE_TYPE} and deletedAt is null`,
    probe,
    reason: lectureMismatchReason(probe),
  })
}

/** Logs why a resource-category lookup failed (missing / deleted / wrong type). */
export async function warnResourceRowNotMatched(
  userId: number,
  resourceId: number,
): Promise<void> {
  const probe = await probeLectureById(resourceId)
  console.warn('[notes-preview] resource row not matched', {
    userId,
    resourceId,
    required: `type == ${LECTURE_RESOURCE_TYPE} and deletedAt is null`,
    probe,
    reason: resourceMismatchReason(probe),
  })
}
