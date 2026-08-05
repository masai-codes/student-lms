import { and, eq, inArray, isNull } from 'drizzle-orm'

import type { EnrolledSection } from '@/server/learn/types'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'
import { resolveSectionLabel } from '@/server/batches/resolveSectionLabel'

/**
 * Section IDs the user is enrolled in for a given batch (legacy lectures/assignments API scope).
 * Scoped to the current request's portal via {@link batchScopeForPortal}, so a
 * cross-portal `batchId` yields no sections.
 */
export async function getSectionIdsForUserInBatch(
  userId: number,
  batchId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        // Legacy LMS scopes by section_user.user_id only (no deleted_at on the
        // enrolment row); only sections.deleted_at is checked.
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}

/**
 * Sections the user is enrolled in for a given batch, for the section filter
 * dropdown. Same scope as {@link getSectionIdsForUserInBatch}: portal-scoped and
 * `sections.deleted_at IS NULL`, keyed on the user's `section_user` rows only.
 *
 * The label prefers `settings.sectionDisplayName` (legacy `assignment.controller`
 * uses the same `settings?.sectionDisplayName || section.name` fallback).
 */
export async function getEnrolledSectionsForUserInBatch(
  userId: number,
  batchId: number,
): Promise<Array<EnrolledSection>> {
  const rows = await db
    .select({
      sectionId: sections.id,
      name: sections.name,
      settings: sections.settings,
    })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )

  const byId = new Map<number, EnrolledSection>()
  for (const row of rows) {
    if (byId.has(row.sectionId)) continue
    byId.set(row.sectionId, {
      sectionId: row.sectionId,
      name: resolveSectionLabel(row.name, row.settings),
    })
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSectionIdsForUserInBatches(
  userId: number,
  batchIds: Array<number>,
): Promise<Array<number>> {
  if (batchIds.length === 0) return []

  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        inArray(sections.batchId, batchIds),
        // Legacy LMS scopes by section_user.user_id only (no deleted_at on the
        // enrolment row); only sections.deleted_at is checked.
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}
