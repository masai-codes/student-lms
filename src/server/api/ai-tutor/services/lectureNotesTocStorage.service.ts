import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import {
  mergeLectureNotesRagData,
  readNotesTocFromLectureData,
} from '@/server/api/ai-tutor/services/lectureNotesTocData'

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function saveLectureNotesRagStatus(input: {
  lectureId: number
  notesRagged: boolean
  notesToc?: string | null
}): Promise<void> {
  const rows = await db
    .select({ data: lectures.data })
    .from(lectures)
    .where(eq(lectures.id, input.lectureId))
    .limit(1)

  if (!rows[0]) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_NOT_FOUND')
  }

  await db
    .update(lectures)
    .set({
      data: mergeLectureNotesRagData(rows[0].data, {
        notesRagged: input.notesRagged,
        notesToc: input.notesToc,
      }),
    })
    .where(eq(lectures.id, input.lectureId))
}

export async function getLectureNotesForRag(lectureId: number): Promise<{
  notes: string
  notesToc: string | null
}> {
  const rows = await db
    .select({ notes: lectures.notes, data: lectures.data })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)

  if (!rows[0]) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_NOT_FOUND')
  }

  const notes = trimOrNull(rows[0].notes)
  if (!notes) {
    throw new ApiError(404, 'AI_TUTOR_NOTES_NOT_FOUND')
  }

  return {
    notes,
    notesToc: readNotesTocFromLectureData(rows[0].data),
  }
}
