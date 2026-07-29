import { inArray } from 'drizzle-orm'

import { db } from '@/db'
import { sections } from '@/db/schema'
import { logger } from '@/lib/logger'
import type { InvalidSection } from '@/server/api/webhooks/admissions/types'
import { classifySection } from '@/server/api/webhooks/admissions/utils/classifySection'

export type ResolvedSections = {
  validSectionIds: number[]
  invalidSectionIds: InvalidSection[]
}

/**
 * Split the requested section ids into the ones we can enrol into (active,
 * non-deleted and belonging to `batchId`) and the ones we cannot, each tagged
 * with a reason. Invalid sections are logged (CloudWatch) but do not fail the
 * request — the caller decides what to do with an empty valid set.
 */
export async function resolveValidSections(
  batchId: number,
  requestedSectionIds: number[],
): Promise<ResolvedSections> {
  const uniqueIds = [...new Set(requestedSectionIds)]

  const rows = await db
    .select({
      id: sections.id,
      batchId: sections.batchId,
      active: sections.active,
      deletedAt: sections.deletedAt,
    })
    .from(sections)
    .where(inArray(sections.id, uniqueIds))

  const rowsById = new Map(rows.map((row) => [row.id, row]))

  const validSectionIds: number[] = []
  const invalidSectionIds: InvalidSection[] = []
  for (const sectionId of uniqueIds) {
    const reason = classifySection(rowsById.get(sectionId), batchId)
    if (reason === null) {
      validSectionIds.push(sectionId)
    } else {
      invalidSectionIds.push({ sectionId, reason })
    }
  }

  if (invalidSectionIds.length > 0) {
    logger.warn({
      msg: 'Ignoring invalid sections for enrolment',
      fn: 'resolveValidSections',
      batchId,
      invalidSectionIds,
    })
  }

  return { validSectionIds, invalidSectionIds }
}
