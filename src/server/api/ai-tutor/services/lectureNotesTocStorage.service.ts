import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { mergeLectureNotesRagData } from '@/server/api/ai-tutor/services/lectureNotesTocData'

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
