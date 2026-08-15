import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'
import type { InterviewDomain } from '@/server/api/interviews/types/interviewSession'

const VALID_DOMAINS = new Set<InterviewDomain>([
  'frontend',
  'backend',
  'fullstack',
  'digital-marketing',
  'product-management',
  'data-analytics',
  'data-science',
  'applied-ai',
  'general',
])

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Parses the ops-configured `batches.meta.interviews` array — the interview
 * tracks ops has enabled for that batch. Unknown/malformed entries are
 * silently dropped rather than failing the whole lookup.
 */
export function parseInterviewDomainsFromMeta(
  meta: unknown,
): Array<InterviewDomain> {
  const raw = asRecord(meta).interviews
  if (!Array.isArray(raw)) return []

  const domains: Array<InterviewDomain> = []
  for (const entry of raw) {
    if (
      typeof entry === 'string' &&
      VALID_DOMAINS.has(entry as InterviewDomain)
    ) {
      domains.push(entry as InterviewDomain)
    }
  }
  return domains
}

/**
 * Resolves the interview domain(s) enabled for the student from
 * `batches.meta.interviews` on their most recently enrolled active batch.
 * No enrollment, or no domains configured on that batch -> `['general']`
 * (catalog-only fallback, never an empty topic list).
 */
export async function resolveInterviewDomains(
  userId: number,
): Promise<Array<InterviewDomain>> {
  const rows = await db
    .select({ meta: batches.meta })
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
  if (!row) return ['general']

  const domains = parseInterviewDomainsFromMeta(row.meta)
  return domains.length > 0 ? domains : ['general']
}
