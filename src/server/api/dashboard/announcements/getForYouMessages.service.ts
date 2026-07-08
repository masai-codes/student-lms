import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { DASHBOARD_ANNOUNCEMENTS_LIMIT } from './announcementFeed'
import type { RankedAnnouncement } from './announcementFeed'
import { db } from '@/db'
import { messages, users } from '@/db/schema'

/**
 * Feed B — personal "For You" messages addressed directly to the user.
 *
 * A row qualifies when it is a top-level bulk message for the user
 * (`message_id IS NULL`, `user_id = me`), not deleted, unread (`read_at IS
 * NULL`), and inside its active window (no `schedule`, or `schedule <= now <=
 * concludes`, IST). Title prefers `meta.title`, falling back to `subject`.
 */
export async function getForYouMessages(
  userId: number,
  istNow: string,
): Promise<Array<RankedAnnouncement>> {
  const rows = await db
    .select({
      id: messages.id,
      subject: messages.subject,
      body: messages.body,
      meta: messages.meta,
      authorName: users.name,
      ctaName: messages.ctaName,
      ctaLink: messages.ctaLink,
      schedule: messages.schedule,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.authorId))
    .where(
      and(
        eq(messages.userId, userId),
        isNull(messages.messageId),
        isNull(messages.deletedAt),
        isNull(messages.readAt),
        or(
          isNull(messages.schedule),
          and(
            sql`${messages.schedule} <= ${istNow}`,
            or(
              isNull(messages.concludes),
              sql`${messages.concludes} >= ${istNow}`,
            ),
          ),
        ),
      ),
    )
    .orderBy(desc(sql`COALESCE(${messages.schedule}, ${messages.createdAt})`))
    .limit(DASHBOARD_ANNOUNCEMENTS_LIMIT)

  return rows.map((row) => ({
      sortedAt: row.schedule ?? row.createdAt,
      item: {
        id: row.id,
        source: 'm' as const,
        title: resolveMessageTitle(row.meta, row.subject),
        body: row.body,
        authorName: row.authorName,
        isForYou: true,
        ctaName: row.ctaName,
        ctaLink: row.ctaLink,
      },
    }))
}

function resolveMessageTitle(meta: unknown, subject: string): string {
  if (meta && typeof meta === 'object' && 'title' in meta) {
    const title = meta.title
    if (typeof title === 'string' && title.length > 0) return title
  }
  return subject
}
