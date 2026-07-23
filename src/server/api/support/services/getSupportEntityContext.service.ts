import { and, eq, isNull, ne } from 'drizzle-orm'

import type {
  SupportEntityCategory,
  SupportEntityContext,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import {
  resolveModuleName,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'

const SUPPORT_ENTITY_CATEGORIES = new Set<SupportEntityCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

function toSupportLectureType(rawType: string): 'live' | 'video' | undefined {
  const normalized = rawType.trim().toLowerCase()
  if (normalized === 'live') return 'live'
  if (normalized === 'video') return 'video'
  return undefined
}

function resolveAssignmentSupportCategory(type: string): SupportEntityCategory {
  return type.trim().toLowerCase() === 'evaluation' ? 'evaluation' : 'assignment'
}

function buildItem(input: {
  id: number
  title: string
  meta: string
  schedule: string | null
  lectureType?: string
  isOptional?: boolean
}): SupportEntityContext['item'] {
  return {
    id: input.id,
    title: input.title,
    meta: input.meta,
    date: input.schedule ? formatSocialPostTime(input.schedule) : 'No schedule',
    type: input.lectureType ? toSupportLectureType(input.lectureType) : undefined,
    startTime: input.schedule ?? undefined,
    isOptional: input.isOptional,
  }
}

async function resolveLectureContext(
  userId: number,
  lectureId: number,
  category: 'lecture' | 'resource',
): Promise<SupportEntityContext> {
  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      week: lectures.week,
      module: lectures.module,
      category: lectures.category,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        category === 'resource'
          ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
          : ne(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error(
      category === 'resource' ? 'SUPPORT_RESOURCE_NOT_FOUND' : 'SUPPORT_LECTURE_NOT_FOUND',
    )
  }

  const row = rows[0]
  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error(
      category === 'resource' ? 'SUPPORT_RESOURCE_NOT_FOUND' : 'SUPPORT_LECTURE_NOT_FOUND',
    )
  }

  const batchId = await getBatchIdForSection(row.sectionId)
  if (batchId == null) {
    throw new Error('SUPPORT_ENTITY_BATCH_NOT_FOUND')
  }

  const isRecommended = toLearningPriority(row.optional) === 'recommended'

  return {
    batchId,
    category,
    item: buildItem({
      id: row.id,
      title: row.title,
      meta:
        category === 'resource'
          ? row.category.trim() || 'Uncategorized'
          : resolveModuleName(row.module, row.week),
      schedule: row.schedule,
      lectureType: category === 'lecture' ? row.type : undefined,
      isOptional: category === 'resource' ? isRecommended : undefined,
    }),
  }
}

async function resolveAssignmentContext(
  userId: number,
  assignmentId: number,
  requestedCategory: 'assignment' | 'evaluation',
): Promise<SupportEntityContext> {
  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      category: assignments.category,
      sectionId: assignments.sectionId,
    })
    .from(assignments)
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const row = rows[0]
  const resolvedCategory = resolveAssignmentSupportCategory(row.type)

  if (requestedCategory === 'evaluation' && resolvedCategory !== 'evaluation') {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const batchId = await getBatchIdForSection(row.sectionId)
  if (batchId == null) {
    throw new Error('SUPPORT_ENTITY_BATCH_NOT_FOUND')
  }

  const isRecommended = toLearningPriority(row.optional) === 'recommended'

  return {
    batchId,
    category: resolvedCategory,
    item: buildItem({
      id: row.id,
      title: row.title,
      meta: row.category.trim() || 'Uncategorized',
      schedule: row.schedule,
      isOptional: isRecommended,
    }),
  }
}

/**
 * Resolve the batch + support item card for a learn detail entity so the floating
 * chat can open directly on "Before you raise a ticket" (step 2.5).
 */
export async function getSupportEntityContext(
  userId: number,
  category: string,
  entityId: number,
): Promise<SupportEntityContext> {
  if (!SUPPORT_ENTITY_CATEGORIES.has(category as SupportEntityCategory)) {
    throw new Error('SUPPORT_INVALID_ENTITY_CATEGORY')
  }

  const normalized = category as SupportEntityCategory

  if (normalized === 'lecture' || normalized === 'resource') {
    return resolveLectureContext(userId, entityId, normalized)
  }

  return resolveAssignmentContext(userId, entityId, normalized)
}
