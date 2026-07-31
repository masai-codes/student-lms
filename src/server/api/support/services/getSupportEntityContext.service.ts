import { and, eq, isNull } from 'drizzle-orm'

import type {
  SupportEntityCategory,
  SupportEntityContext,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { toLearningPriority } from '@/server/learn/utils/learningDataMappers'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { getLectureSupportSnapshot } from '@/server/api/support/services/getLectureSupportSnapshot.service'
import { buildSupportLectureItemFromSnapshot } from '@/server/api/support/utils/buildSupportLectureItemFromSnapshot'

const SUPPORT_ENTITY_CATEGORIES = new Set<SupportEntityCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

function resolveAssignmentSupportCategory(type: string): SupportEntityCategory {
  return type.trim().toLowerCase() === 'evaluation'
    ? 'evaluation'
    : 'assignment'
}

function buildAssignmentItem(input: {
  id: number
  title: string
  meta: string
  schedule: string | null
  isOptional?: boolean
  isMandatory?: boolean
}): SupportEntityContext['item'] {
  return {
    id: input.id,
    title: input.title,
    meta: input.meta,
    date: input.schedule ? formatSocialPostTime(input.schedule) : 'No schedule',
    startTime: input.schedule ?? undefined,
    isOptional: input.isOptional,
    isMandatory: input.isMandatory,
  }
}

async function resolveLectureContext(
  userId: number,
  lectureId: number,
  category: 'lecture' | 'resource',
): Promise<SupportEntityContext> {
  if (category === 'lecture') {
    const lectureSnapshot = await getLectureSupportSnapshot(userId, lectureId)
    return {
      batchId: lectureSnapshot.batchId,
      category,
      item: buildSupportLectureItemFromSnapshot(lectureSnapshot),
      lectureSnapshot,
    }
  }

  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      schedule: lectures.schedule,
      category: lectures.category,
      sectionId: lectures.sectionId,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        eq(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUPPORT_RESOURCE_NOT_FOUND')
  }

  const row = rows[0]
  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('SUPPORT_RESOURCE_NOT_FOUND')
  }

  const batchId = await getBatchIdForSection(row.sectionId)
  if (batchId == null) {
    throw new Error('SUPPORT_ENTITY_BATCH_NOT_FOUND')
  }

  return {
    batchId,
    category,
    item: buildAssignmentItem({
      id: row.id,
      title: row.title,
      meta: row.category.trim() || 'Uncategorized',
      schedule: row.schedule,
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

  const priority = toLearningPriority(row.optional)

  return {
    batchId,
    category: resolvedCategory,
    item: buildAssignmentItem({
      id: row.id,
      title: row.title,
      meta: row.category.trim() || 'Uncategorized',
      schedule: row.schedule,
      isOptional: priority === 'recommended',
      isMandatory: priority === 'mandatory',
    }),
  }
}

/**
 * Resolve the batch + support item card for a learn detail entity so the floating
 * chat can open directly on "Before you raise a ticket" (step 2.5).
 *
 * Lectures reuse {@link getLectureSupportSnapshot} so the context API and the
 * listing path share one snapshot payload.
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
