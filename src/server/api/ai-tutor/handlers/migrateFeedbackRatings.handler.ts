import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { migrateAiTutorFeedbackRatings } from '@/server/api/ai-tutor/migrateAiTutorFeedbackRatings.service'
import { isAdminRole } from '@/server/auth/v2/portalGate'

type MigrateFeedbackRatingsBody = {
  dryRun?: unknown
}

async function requireAdminUserId(): Promise<number> {
  const userId = await requireSessionUserId()
  const rows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!rows[0] || !isAdminRole(rows[0].role ?? null)) {
    throw new ApiError(403, 'AI_TUTOR_MIGRATION_FORBIDDEN')
  }

  return userId
}

export async function handleMigrateFeedbackRatings(
  request: Request,
): Promise<Response> {
  try {
    await requireAdminUserId()
    const body = (await request.json().catch(() => null)) as
      | MigrateFeedbackRatingsBody
      | null
    const dryRun = body?.dryRun === true

    const data = await migrateAiTutorFeedbackRatings({ dryRun })
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to migrate ai-tutor feedback ratings', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_MIGRATING_AI_TUTOR_FEEDBACK_RATINGS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
