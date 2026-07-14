import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { lecturesAi } from '@/db/schema'
import { db } from '@/db'

export const fetchLectureTranscript = createServerFn({ method: 'GET' })
  .inputValidator((data: { lectureId: number }) => data)
  .handler(async ({ data }) => {
    try {
      const transcript = await db
        .select()
        .from(lecturesAi)
        .where(eq(lecturesAi.lectureId, data.lectureId))

      return transcript[0] ?? null
    } catch (err) {
      console.error('🔥 Server/DB error', err)
      throw new Error('SERVER_ERROR_FETCHING_TRANSCRIPT')
    }
  })
