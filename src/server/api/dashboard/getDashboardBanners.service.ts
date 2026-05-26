import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

export interface DashboardBannerItem {
  id: number
  type: string | null
  variant: string | null
  groupName: string | null
  title: string
  description: string | null
  imageUrl: string | null
  ctaUrl: string | null
}

type RawBannerRow = {
  id: number | string | bigint
  type: string | null
  variant: string | null
  group_name: string | null
  title: string
  description: string | null
  image_url: string | null
  cta_url: string | null
  visible_to: string | Record<string, unknown> | null
}

type VisibleTo = {
  batches: Array<string>
  random_group: Array<string>
}

/** userId % 4 → A / B / C / D */
const GROUP_LETTERS = ['A', 'B', 'C', 'D'] as const

function normalizeRows(result: unknown): Array<RawBannerRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawBannerRow>
    return result as Array<RawBannerRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<RawBannerRow> }).rows
  }
  return []
}

function parseVisibleTo(raw: RawBannerRow['visible_to']): VisibleTo {
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return { batches: [], random_group: [] }
    const p = parsed as Record<string, unknown>
    return {
      batches: Array.isArray(p['batches']) ? (p['batches'] as Array<unknown>).map(String) : [],
      random_group: Array.isArray(p['random_group'])
        ? (p['random_group'] as Array<unknown>).map(String)
        : [],
    }
  } catch {
    return { batches: [], random_group: [] }
  }
}

/**
 * Fetches banners visible to the given user, applying four filters in order:
 *
 * 1. DB-level: is_active=1, isMasaiVerse=false, start_date < NOW < end_date
 * 2. Batch filter: visible_to.batches is empty (all) OR at least one of the
 *    user's enrolled batches is listed
 * 3. Group filter: visible_to.random_group is empty (all) OR the user's
 *    group letter (userId % 4 → A/B/C/D) is listed
 */
export async function getDashboardBanners(
  userId: number,
): Promise<Array<DashboardBannerItem>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  const userBatchIdStrings = batchIds.map(String)
  const userGroup = GROUP_LETTERS[userId % 4]

  const result = await db.execute(sql`
    SELECT
      id,
      type,
      variant,
      group_name,
      title,
      description,
      image_url,
      cta_url,
      visible_to
    FROM banners
    WHERE is_active = 1
      AND settings->>'$.isMasaiVerse' = 'false'
      AND start_date < NOW()
      AND NOW() < end_date
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  `)

  const rows = normalizeRows(result)

  const visible = rows.filter((row) => {
    const { batches, random_group } = parseVisibleTo(row.visible_to)

    // Empty batches = show to everyone; otherwise at least one batch must match
    const batchOk =
      batches.length === 0 || batches.some((b) => userBatchIdStrings.includes(b))

    // Empty random_group = show to everyone; otherwise user's group must be listed
    const groupOk = random_group.length === 0 || random_group.includes(userGroup)

    return batchOk && groupOk
  })

  return visible.map((row) => ({
    id: Number(row.id),
    type: row.type ?? null,
    variant: row.variant ?? null,
    groupName: row.group_name ?? null,
    title: String(row.title ?? ''),
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    ctaUrl: row.cta_url ?? null,
  }))
}
