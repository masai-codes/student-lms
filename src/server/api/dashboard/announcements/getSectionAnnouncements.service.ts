import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { DASHBOARD_ANNOUNCEMENTS_LIMIT } from './announcementFeed'
import type { RankedAnnouncement } from './announcementFeed'
import { db } from '@/db'
import { announcementReads, announcements, users } from '@/db/schema'

/**
 * Feed A — batch/section announcements still unread by the user.
 *
 * A row qualifies when it belongs to one of the user's sections, is not
 * deleted, is inside its release window (`schedule <= now <= concludes`, IST),
 * has `track_read = true`, and is still unread — meaning no read record, a read
 * record flagged `is_unread`, or an undisplayed popup.
 */
export async function getSectionAnnouncements(
  sectionIds: Array<number>,
  userId: number,
  istNow: string,
): Promise<Array<RankedAnnouncement>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.subject,
      body: announcements.body,
      authorName: users.name,
      ctaName: announcements.ctaName,
      ctaLink: announcements.ctaLink,
      schedule: announcements.schedule,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.userId))
    .leftJoin(
      announcementReads,
      and(
        eq(announcementReads.announcementId, announcements.id),
        eq(announcementReads.userId, userId),
      ),
    )
    .where(
      and(
        inArray(announcements.sectionId, sectionIds),
        isNull(announcements.deletedAt),
        or(
          isNull(announcements.schedule),
          sql`${announcements.schedule} <= ${istNow}`,
        ),
        or(
          isNull(announcements.concludes),
          sql`${announcements.concludes} >= ${istNow}`,
        ),
        eq(announcements.trackRead, 1),
        or(
          isNull(announcementReads.id),
          eq(announcementReads.isUnread, 1),
          and(
            eq(announcements.showAsPopup, 1),
            or(
              isNull(announcementReads.popupDisplay),
              eq(announcementReads.popupDisplay, 0),
            ),
          ),
        ),
      ),
    )
    .orderBy(desc(sql`COALESCE(${announcements.schedule}, ${announcements.createdAt})`))
    .limit(DASHBOARD_ANNOUNCEMENTS_LIMIT)

  return rows.map((row) => ({
      sortedAt: row.schedule ?? row.createdAt,
      item: {
        id: row.id,
        source: 'a' as const,
        title: row.title,
        body: row.body,
        authorName: row.authorName,
        isForYou: false,
        ctaName: row.ctaName,
        ctaLink: row.ctaLink,
      },
    }))
}
