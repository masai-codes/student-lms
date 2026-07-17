import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForSections } from '@/server/batches/getBatchIdsForSections'
import {
  getCancelledBatchIds,
  getPausedCutoff,
} from '@/server/restrictions/enrollmentRestrictionScope'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'

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

export async function getAnnouncementPopups(
  userId: number,
): Promise<PopupItem[]> {
  const sectionResult = await db.execute(sql`
    SELECT DISTINCT section_id FROM section_user
    WHERE user_id = ${userId} AND deleted_at IS NULL
  `)
  const sectionIds = normalizeRows(sectionResult)
    .map((r) => Number(r.section_id))
    .filter(Number.isFinite)

  // Drop sections of enrolment-cancelled batches; exclude paused batches'
  // announcements scheduled after their cutoff.
  const restrictions = await getUserBatchRestrictions(userId)
  let effectiveSectionIds = sectionIds
  let pausedClause: SQL = sql``
  if (restrictions.size > 0 && sectionIds.length > 0) {
    const sectionToBatch = await getBatchIdsForSections(sectionIds)
    const cancelled = getCancelledBatchIds(restrictions)
    effectiveSectionIds = sectionIds.filter((sid) => {
      const batchId = sectionToBatch.get(sid)
      return batchId == null || !cancelled.has(batchId)
    })
    const pausedGroups = new Map<number, Array<number>>()
    for (const sid of effectiveSectionIds) {
      const batchId = sectionToBatch.get(sid)
      if (batchId != null && getPausedCutoff(restrictions, batchId) != null) {
        const arr = pausedGroups.get(batchId) ?? []
        arr.push(sid)
        pausedGroups.set(batchId, arr)
      }
    }
    for (const [batchId, secs] of pausedGroups) {
      const cutoff = getPausedCutoff(restrictions, batchId)
      if (cutoff == null) continue
      pausedClause = sql`${pausedClause} AND NOT (a.section_id IN (${sql.raw(secs.join(', '))}) AND a.schedule > ${cutoff})`
    }
  }
  const sectionIdList =
    effectiveSectionIds.length > 0 ? effectiveSectionIds.join(', ') : '0'

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
      AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))${pausedClause}
      AND (a.concludes IS NULL OR a.concludes >= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      AND (ar.id IS NULL OR ar.read_at IS NULL)
    ORDER BY a.created_at DESC
  `)

  const msgResult = await db.execute(sql`
    SELECT
      m.id,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS title,
      m.body,
      m.cta_name AS ctaName,
      m.cta_link AS ctaLink
    FROM messages m
    WHERE m.user_id = ${userId}
      AND m.message_id IS NULL
      AND m.deleted_at IS NULL
      AND m.read_at IS NULL
      AND m.show_as_popup = 1
      AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      AND (m.concludes IS NULL OR m.concludes >= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
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
    ctaName: r.ctaName ? String(r.ctaName) : null,
    ctaLink: r.ctaLink ? String(r.ctaLink) : null,
  }))

  return [...annItems, ...msgItems]
}
