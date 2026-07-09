import { eq } from 'drizzle-orm'
import type { LectureChatMaterials } from '@/server/api/ai-tutor/types/lectureChatMaterials'
import { db } from '@/db'
import { lectures, lecturesAi } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { isRagPlatformConfigured } from '@/server/api/ai-tutor/clients/ragPlatform'
import {
  readNotesRaggedFromLectureData,
  readNotesTocFromLectureData,
} from '@/server/api/ai-tutor/services/lectureNotesTocData'

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function getLectureChatMaterials(
  lectureId: number,
): Promise<LectureChatMaterials> {
  const [lectureRows, aiRows] = await Promise.all([
    db
      .select({ notes: lectures.notes, data: lectures.data })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1),
    db
      .select({ summary: lecturesAi.summary })
      .from(lecturesAi)
      .where(eq(lecturesAi.lectureId, lectureId))
      .limit(1),
  ])

  if (!lectureRows[0]) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_NOT_FOUND')
  }

  const notes = trimOrNull(lectureRows[0].notes)
  const summary = trimOrNull(aiRows[0]?.summary)
  const notesCharacterCount = notes?.length ?? 0
  const notesRagged = readNotesRaggedFromLectureData(lectureRows[0].data) === true

  if (notesRagged) {
    return {
      lectureId,
      summary,
      notesRagged: true,
      notesInline: null,
      notesOutline: readNotesTocFromLectureData(lectureRows[0].data),
      notesCharacterCount,
      ragRetrievalAvailable: isRagPlatformConfigured(),
    }
  }

  return {
    lectureId,
    summary,
    notesRagged: false,
    notesInline: notes,
    notesOutline: null,
    notesCharacterCount,
    ragRetrievalAvailable: false,
  }
}
