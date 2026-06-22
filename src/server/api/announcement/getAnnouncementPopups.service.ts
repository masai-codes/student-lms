import { sql } from 'drizzle-orm'
import { db } from '@/db'

export interface PopupItem {
  id: string
  source: 'a' | 'm'
  title: string
  body: string
  ctaName: string | null
  ctaLink: string | null
}

function normalizeRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

export async function getAnnouncementPopups(userId: number): Promise<PopupItem[]> {
  const sectionResult = await db.execute(sql`
    SELECT DISTINCT section_id FROM section_user
    WHERE user_id = ${userId} AND deleted_at IS NULL
  `)
  const sectionIds = normalizeRows(sectionResult)
    .map((r) => Number(r.section_id))
    .filter(Number.isFinite)
  const sectionIdList = sectionIds.length > 0 ? sectionIds.join(', ') : '0'

  const annResult = await db.execute(sql`
    SELECT
      a.id,
      a.subject  AS title,
      a.body,
      a.cta_name AS ctaName,
      a.cta_link AS ctaLink
    FROM announcements a
    LEFT JOIN announcement_reads ar
      ON ar.announcement_id = a.id AND ar.user_id = ${userId}
    WHERE a.section_id IN (${sql.raw(sectionIdList)})
      AND a.show_as_popup = 1
      AND a.deleted_at IS NULL
      AND a.track_read = 1
      AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      AND (ar.id IS NULL OR ar.read_at IS NULL)
    ORDER BY a.created_at DESC
  `)

  const msgResult = await db.execute(sql`
    SELECT
      m.id,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS title,
      m.body,
      NULL AS ctaName,
      NULL AS ctaLink
    FROM messages m
    WHERE m.user_id = ${userId}
      AND m.message_id IS NULL
      AND m.deleted_at IS NULL
      AND m.read_at IS NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.show_as_popup')) = '1'
    ORDER BY m.created_at DESC
  `)

  const annItems: PopupItem[] = normalizeRows(annResult).map((r) => ({
    id: String(r.id),
    source: 'a',
    title: String(r.title ?? ''),
    body: String(r.body ?? ''),
    ctaName: r.ctaName ? String(r.ctaName) : null,
    ctaLink: r.ctaLink ? String(r.ctaLink) : null,
  }))

  const msgItems: PopupItem[] = normalizeRows(msgResult).map((r) => ({
    id: String(r.id),
    source: 'm',
    title: String(r.title ?? ''),
    body: String(r.body ?? ''),
    ctaName: null,
    ctaLink: null,
  }))

  return [...annItems, ...msgItems]
}
