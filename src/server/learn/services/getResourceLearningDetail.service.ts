import { and, eq, isNull } from 'drizzle-orm'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { DISCUSSION_ENTITY_LECTURE } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsWithThreadsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { buildResourceDetailPayload } from '@/server/learn/utils/buildResourceDetailPayload'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { resolveLearnDetailRestriction } from '@/server/restrictions/resolveLearnDetailRestriction'
import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'
import {
  isSupportedResourceLectureType,
} from '@/server/learn/utils/normalizeResourceKind'
import { getAllAssociatedEntities } from '@/server/learn/services/getAllAssociatedEntities.service'
import { getLearnEntityBookmarkState } from '@/server/learn/services/learnEntityBookmark.service'
import { dedupeLearnAssociatedItems } from '@/server/learn/utils/dedupeLearnAssociatedItems'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

export async function getResourceLearningDetailForUser(
  userId: number,
  resourceId: number,
): Promise<ResourceDetailPayload> {
  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      week: lectures.week,
      module: lectures.module,
      batchId: lectures.batchId,
      sectionId: lectures.sectionId,
      hostName: users.name,
      hostAvatarUrl: users.profilePhotoPath,
      notes: lectures.notes,
      description: lectures.description,
      settings: lectures.settings,
      data: lectures.data,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(
      and(
        eq(lectures.id, resourceId),
        isNull(lectures.deletedAt),
        eq(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]

  if (!isSupportedResourceLectureType(row.type)) {
    throw new Error('RESOURCE_DETAIL_UNSUPPORTED_TYPE')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    row.batchId,
    row.sectionId,
  )

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const [discussions, associatedItems, isBookmarked] = await Promise.all([
    listDiscussionsWithThreadsForLearnEntity(
      userId,
      DISCUSSION_ENTITY_LECTURE,
      resourceId,
    ),
    getAllAssociatedEntities({
      entityId: resourceId,
      entityKind: 'resource',
      sectionId: row.sectionId,
      entityData: row.data,
    }),
    getLearnEntityBookmarkState(userId, 'resource', resourceId),
  ])

  const core = buildLearnDetailPresentation(row)

  const payload = buildResourceDetailPayload(
    { ...core, discussions },
    {
      category: row.category,
      schedule: row.schedule,
      concludes: row.concludes,
      hostAvatarUrl: row.hostAvatarUrl,
      notes: row.notes,
      description: row.description,
      settings: row.settings,
    },
    Date.now(),
    dedupeLearnAssociatedItems(associatedItems, {
      kind: 'resource',
      id: resourceId,
    }),
    isBookmarked,
  )

  const [restrictions, sectionBatchId] = await Promise.all([
    getUserBatchRestrictions(userId),
    getBatchIdForSection(row.sectionId),
  ])
  // Agreement ban never restricts resources — only enrolment-cancelled / paused apply.
  const restriction = resolveLearnDetailRestriction({
    contentBatchId: sectionBatchId ?? row.batchId,
    schedule: row.schedule,
    restrictions,
    agreementScope: null,
  })

  return { ...payload, restriction }
}
