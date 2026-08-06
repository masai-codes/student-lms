import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'
import type { InterviewDomain } from '@/server/api/interviews/types/interviewSession'

const DATA_AI_ML_PATTERN = /data|ml|ai\b|analytics/i
const PRODUCT_MANAGEMENT_PATTERN = /product|\bpm\b/i

/**
 * Maps a batch's free-text `program` / `programDomain` (ops-entered, no fixed
 * enum) to one of our interview domains via keyword matching, mirroring the
 * "resolve with graceful fallback" shape of `resolveModuleName`.
 */
export function classifyProgramText(
  text: string | null | undefined,
): InterviewDomain | null {
  const value = text?.trim()
  if (!value) return null
  if (DATA_AI_ML_PATTERN.test(value)) return 'data-ai-ml'
  if (PRODUCT_MANAGEMENT_PATTERN.test(value)) return 'product-management'
  return 'software-development'
}

/**
 * Resolves the student's interview domain from their most recently enrolled
 * active batch. No enrollment → `general` (catalog-only fallback, never an
 * empty topic list).
 */
export async function resolveInterviewDomain(
  userId: number,
): Promise<InterviewDomain> {
  const rows = await db
    .select({
      programDomain: batches.programDomain,
      program: batches.program,
    })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
        eq(batches.active, 1),
        batchScopeForPortal(),
      ),
    )
    // createdAt has only second-level resolution, so a same-second tie (common
    // in fast seed scripts) needs a tiebreaker — higher id is a reliable proxy
    // for "inserted later" regardless of timestamp granularity.
    .orderBy(desc(sectionUser.createdAt), desc(sectionUser.id))
    .limit(1)

  const row = rows.at(0)
  if (!row) return 'general'

  return (
    classifyProgramText(row.programDomain) ??
    classifyProgramText(row.program) ??
    'software-development'
  )
}
