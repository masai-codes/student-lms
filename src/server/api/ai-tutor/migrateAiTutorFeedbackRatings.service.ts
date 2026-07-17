import { eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { aiChatPracticeQuestions } from '@/db/schema'
import { computeMigratedFeedbackRating } from '@/server/api/ai-tutor/migrateFeedbackRating'

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type MigrateAiTutorFeedbackRatingsResult = {
  dryRun: boolean
  scanned: number
  updated: number
  unchanged: number
  skipped: number
  changes: Array<{
    id: number
    previousRating: number
    rating: number
  }>
  skippedRows: Array<{
    id: number
    rating: number
    reason: 'MOBILE_RATING_BELOW_MIN'
  }>
}

export async function migrateAiTutorFeedbackRatings(input: {
  dryRun?: boolean
}): Promise<MigrateAiTutorFeedbackRatingsResult> {
  const dryRun = input.dryRun ?? false
  const rows = await db
    .select({
      id: aiChatPracticeQuestions.id,
      rating: aiChatPracticeQuestions.rating,
      feedback: aiChatPracticeQuestions.feedback,
    })
    .from(aiChatPracticeQuestions)
    .where(isNotNull(aiChatPracticeQuestions.rating))

  const result: MigrateAiTutorFeedbackRatingsResult = {
    dryRun,
    scanned: rows.length,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    changes: [],
    skippedRows: [],
  }

  const now = nowTimestamp()

  for (const row of rows) {
    const currentRating = row.rating
    if (currentRating == null) continue

    const migration = computeMigratedFeedbackRating(
      currentRating,
      row.feedback ?? null,
    )

    if (migration.kind === 'updated') {
      result.updated += 1
      result.changes.push({
        id: row.id,
        previousRating: migration.previousRating,
        rating: migration.rating,
      })

      if (!dryRun) {
        await db
          .update(aiChatPracticeQuestions)
          .set({ rating: migration.rating, updatedAt: now })
          .where(eq(aiChatPracticeQuestions.id, row.id))
      }
      continue
    }

    if (migration.kind === 'skipped') {
      result.skipped += 1
      result.skippedRows.push({
        id: row.id,
        rating: migration.rating,
        reason: migration.reason,
      })
      continue
    }

    result.unchanged += 1
  }

  return result
}
