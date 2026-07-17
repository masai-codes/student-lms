import { eq } from 'drizzle-orm'
import type { LectureRagContent } from '@/server/api/ai-tutor/types/lectureRagIngest'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function getLectureRagContent(
  lectureId: number,
): Promise<LectureRagContent> {
  const lectureRows = await db
    .select({
      notes: lectures.notes,
      batchId: lectures.batchId,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)

  if (!lectureRows[0]) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_NOT_FOUND')
  }

  const notes = trimOrNull(lectureRows[0].notes)
  if (!notes) {
    throw new ApiError(404, 'AI_TUTOR_NOTES_NOT_FOUND')
  }

  return {
    lectureId,
    notes,
    batchId: lectureRows[0].batchId ?? null,
    sectionId: lectureRows[0].sectionId ?? null,
  }
}
