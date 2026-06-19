import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { assessNpsSubmissions } from '@/db/schema'

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function handleAssessNpsCallback(
  submissionId: number,
  eventType: string | undefined,
): Promise<void> {
  const now = nowMysql()

  if (eventType === 'endAssessment') {
    await db
      .update(assessNpsSubmissions)
      .set({ completedAt: now, updatedAt: now })
      .where(eq(assessNpsSubmissions.id, submissionId))
  } else {
    await db
      .update(assessNpsSubmissions)
      .set({ updatedAt: now })
      .where(eq(assessNpsSubmissions.id, submissionId))
  }
}
