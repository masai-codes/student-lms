import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { lecturesAi } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

export async function getLectureSummaryForChat(
  lectureId: number,
): Promise<string> {
  const rows = await db
    .select({ summary: lecturesAi.summary })
    .from(lecturesAi)
    .where(eq(lecturesAi.lectureId, lectureId))
    .limit(1)

  const summary = rows[0]?.summary?.trim()
  if (!summary) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_SUMMARY_NOT_FOUND')
  }

  return summary
}
