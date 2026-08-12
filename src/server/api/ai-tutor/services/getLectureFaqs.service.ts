import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { lecturesAi } from '@/db/schema'
import type { LectureAiFaq } from '@/server/api/ai-tutor/types/lectureFaqs'
import { parseLectureAiFaqs } from '@/server/api/ai-tutor/types/lectureFaqs'

/** FAQs seeded on the lecture's `lectures_ai.faqs` row, if any. */
export async function getLectureFaqs(
  lectureId: number,
): Promise<Array<LectureAiFaq>> {
  const rows = await db
    .select({ faqs: lecturesAi.faqs })
    .from(lecturesAi)
    .where(eq(lecturesAi.lectureId, lectureId))
    .limit(1)

  return parseLectureAiFaqs(rows[0]?.faqs)
}
