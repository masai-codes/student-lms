/**
 * Support module — FAQ / knowledge-base services.
 *
 * Backed entirely by the `help_faqs` table (per-batch articles). Three concerns:
 *   1. {@link searchFaqs}          — search/list articles for a batch.
 *   2. {@link getCategoriesForBatch} — derive the category→subcategory tree.
 *   3. {@link voteFaq}             — record 👍/👎 helpfulness (stored in meta).
 *
 * Categories are derived from the FAQs themselves (the legacy
 * `getFaqCategoriesWithSubcategoriesByBatch` does the same), so the browse tree
 * and the article set can never drift apart.
 */

import { and, eq, like, or, sql } from 'drizzle-orm'
import type {
  FaqVote,
  SupportCategory,
  SupportFaq,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { helpFaqs } from '@/db/schema'

/** Turn a slug ("evaluation-score") into a label ("Evaluation Score"). */
function toLabel(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function toFaq(row: typeof helpFaqs.$inferSelect): SupportFaq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    subCategory: row.subCategory,
    batchId: row.batchId,
  }
}

/**
 * Search/list FAQs for a batch.
 *
 * @param batchId   Required — FAQs are always batch-scoped.
 * @param search    Optional free-text matched against question + answer.
 * @param category  Optional category slug filter.
 * @param subCategory Optional subcategory slug filter.
 * @param limit     Max rows (default 20).
 */
export async function searchFaqs(input: {
  batchId: number
  search?: string
  category?: string
  subCategory?: string
  limit?: number
}): Promise<Array<SupportFaq>> {
  const conditions = [
    eq(helpFaqs.batchId, input.batchId),
    eq(helpFaqs.isHidden, 0),
  ]

  if (input.category) conditions.push(eq(helpFaqs.category, input.category))
  if (input.subCategory)
    conditions.push(eq(helpFaqs.subCategory, input.subCategory))

  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`
    const textMatch = or(like(helpFaqs.question, term), like(helpFaqs.answer, term))
    if (textMatch) conditions.push(textMatch)
  }

  const rows = await db
    .select()
    .from(helpFaqs)
    .where(and(...conditions))
    .limit(input.limit ?? 20)

  return rows.map(toFaq)
}

/**
 * Build the category → subcategory tree for a batch by grouping its FAQs.
 * Returned in stable, label-sorted order so the browse grid is deterministic.
 */
export async function getCategoriesForBatch(
  batchId: number,
): Promise<Array<SupportCategory>> {
  const rows = await db
    .select({ category: helpFaqs.category, subCategory: helpFaqs.subCategory })
    .from(helpFaqs)
    .where(and(eq(helpFaqs.batchId, batchId), eq(helpFaqs.isHidden, 0)))

  const map = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.category) continue
    if (!map.has(row.category)) map.set(row.category, new Set())
    if (row.subCategory) map.get(row.category)!.add(row.subCategory)
  }

  return Array.from(map.entries())
    .map(([value, subs]) => ({
      value,
      label: toLabel(value),
      subcategories: Array.from(subs)
        .map((s) => ({ value: s, label: toLabel(s) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Record a helpfulness vote for an FAQ.
 *
 * Votes are aggregated into `help_faqs.meta.votes = { upvotes, downvotes }`
 * (the legacy system also keeps votes in meta). This avoids an extra table while
 * the volume is low; revisit if per-user vote tracking is needed.
 *
 * @returns the new aggregate counts.
 */
export async function voteFaq(input: {
  faqId: number
  vote: FaqVote
}): Promise<{ faqId: number; upvotes: number; downvotes: number }> {
  const rows = await db
    .select({ meta: helpFaqs.meta })
    .from(helpFaqs)
    .where(eq(helpFaqs.id, input.faqId))

  if (rows.length === 0) throw new Error('SUPPORT_FAQ_NOT_FOUND')

  const meta = (rows[0].meta ?? {}) as Record<string, any>
  const votes = (meta.votes ?? {}) as { upvotes?: number; downvotes?: number }
  const upvotes = (votes.upvotes ?? 0) + (input.vote === 'upvote' ? 1 : 0)
  const downvotes = (votes.downvotes ?? 0) + (input.vote === 'downvote' ? 1 : 0)

  await db
    .update(helpFaqs)
    .set({ meta: { ...meta, votes: { upvotes, downvotes } } })
    .where(eq(helpFaqs.id, input.faqId))

  return { faqId: input.faqId, upvotes, downvotes }
}

/** A tiny helper used by the overview to count FAQs without fetching them. */
export async function countFaqsForBatch(batchId: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(helpFaqs)
    .where(and(eq(helpFaqs.batchId, batchId), eq(helpFaqs.isHidden, 0)))
  // count(*) always returns exactly one row.
  return Number(rows[0].count)
}
