import { count, desc } from 'drizzle-orm'
import { db } from '@/db'
import { whatsnew } from '@/db/schema'

export interface WhatsNewItem {
  id: number
  title: string
  createdAt: string
}

export interface GetWhatsNewResult {
  items: Array<WhatsNewItem>
  total: number
}

const WHATS_NEW_PER_PAGE = 10

function formatIST(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
  return `${datePart}, ${timePart} (IST)`
}

/**
 * Fetches a paginated list of whatsnew items.
 *
 * - No filters — all rows
 * - ORDER BY created_at DESC
 * - 15 rows per page, 0-indexed at DB level (OFFSET (page - 1) * 15)
 * - page param is 1-indexed (coming from URL)
 */
export async function getWhatsNew(page: number): Promise<GetWhatsNewResult> {
  const offset = (page - 1) * WHATS_NEW_PER_PAGE

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(whatsnew),
    db
      .select({
        id: whatsnew.id,
        subject: whatsnew.subject,
        createdAt: whatsnew.createdAt,
      })
      .from(whatsnew)
      .orderBy(desc(whatsnew.createdAt))
      .limit(WHATS_NEW_PER_PAGE)
      .offset(offset),
  ])

  const total = totalResult[0]?.total ?? 0

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.subject,
      createdAt: formatIST(row.createdAt),
    })),
    total,
  }
}
