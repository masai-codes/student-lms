/**
 * Support module — FAQ / knowledge-base services.
 *
 * Concerns:
 *   1. {@link getTicketCategories} — the category→subcategory tree, read from the
 *      `menus` table (global), matching the legacy
 *      `getTicketCategoriesWithSubcategories` — this is what the Help tab shows.
 *   2. {@link searchFaqs}          — search/list `help_faqs` articles for a batch.
 *   3. {@link voteFaq}             — record 👍/👎 helpfulness (stored in meta).
 */

import { and, asc, eq, like, or, sql } from 'drizzle-orm'
import type {
  FaqVote,
  SupportCategory,
  SupportFaq,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { helpFaqs, menus } from '@/db/schema'

/** `menus.category` value holding the ticket categories. */
const TICKET_CATEGORY_MENU = 'tickets-category'
/** `menus.category` suffix holding a category's subcategories. */
const SUBCATEGORY_SUFFIX = '-subcategory'

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
    const textMatch = or(
      like(helpFaqs.question, term),
      like(helpFaqs.answer, term),
    )
    if (textMatch) conditions.push(textMatch)
  }

  const rows = await db
    .select()
    .from(helpFaqs)
    .where(and(...conditions))
    .orderBy(asc(helpFaqs.id))
    .limit(input.limit ?? 20)

  return rows.map(toFaq)
}

/**
 * The full ticket category → subcategory tree, **from the `menus` table** —
 * exactly like the legacy `getTicketCategoriesWithSubcategories`:
 *   - categories: `menus` rows where category = 'tickets-category'
 *   - subcategories: `menus` rows where category ends with '-subcategory';
 *     a category `value` owns the subcategories whose menu category is
 *     `"{value}-subcategory"`.
 *
 * This is global (not batch-scoped) and is the authoritative list the Help tab
 * shows. (Deriving it from `help_faqs` per batch — the previous approach — was
 * why far fewer categories appeared.)
 */
export async function getTicketCategories(): Promise<Array<SupportCategory>> {
  const [categoryRows, subcategoryRows] = await Promise.all([
    db
      .select({ value: menus.value, ordering: menus.ordering })
      .from(menus)
      .where(
        and(eq(menus.category, TICKET_CATEGORY_MENU), eq(menus.deprecated, 0)),
      )
      .orderBy(asc(menus.ordering)),
    db
      .select({
        category: menus.category,
        value: menus.value,
        ordering: menus.ordering,
      })
      .from(menus)
      .where(
        and(
          like(menus.category, `%${SUBCATEGORY_SUFFIX}`),
          eq(menus.deprecated, 0),
        ),
      )
      .orderBy(asc(menus.category), asc(menus.ordering)),
  ])

  return categoryRows.map((cat) => ({
    value: cat.value,
    label: toLabel(cat.value),
    subcategories: subcategoryRows
      .filter((sub) => sub.category === `${cat.value}${SUBCATEGORY_SUFFIX}`)
      .map((sub) => ({ value: sub.value, label: toLabel(sub.value) })),
  }))
}

/**
 * The subcategories for a **single** category, read straight from the `menus`
 * table — mirrors the legacy `getSubcategoriesByCategory` resolver.
 *
 * Used by the context-scoped "Raise Ticket" flow on lecture / resource /
 * assignment pages, where the category is fixed by the page and the student only
 * picks a subcategory. These context categories (e.g. `lecture`, `resource`)
 * are NOT part of the `tickets-category` help tree, so they would never appear
 * in {@link getTicketCategories} — hence this dedicated lookup.
 */
export async function getSubcategoriesByCategory(
  categoryValue: string,
): Promise<Array<{ value: string; label: string }>> {
  const rows = await db
    .select({ value: menus.value, ordering: menus.ordering })
    .from(menus)
    .where(
      and(
        eq(menus.category, `${categoryValue}${SUBCATEGORY_SUFFIX}`),
        eq(menus.deprecated, 0),
      ),
    )
    .orderBy(asc(menus.ordering))

  return rows.map((row) => ({ value: row.value, label: toLabel(row.value) }))
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
