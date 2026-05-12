import { and, eq, isNull, ne } from 'drizzle-orm'

import type { LearnHubDetailPayload } from '@/server/learn/types'

import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { DISCUSSION_ENTITY_LECTURE } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsForLearnEntity'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

export async function getLectureLearningDetailForUser(
  userId: number,
  lectureId: number
): Promise<LearnHubDetailPayload> {
  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      week: lectures.week,
      module: lectures.module,
      batchId: lectures.batchId,
      sectionId: lectures.sectionId,
      hostName: users.name,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        ne(lectures.type, LECTURE_RESOURCE_TYPE)
      )
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.batchId, row.sectionId)

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const core = buildLearnDetailPresentation(row)
  const discussions = await listDiscussionsForLearnEntity(
    userId,
    DISCUSSION_ENTITY_LECTURE,
    lectureId
  )
  return { ...core, discussions }
}
