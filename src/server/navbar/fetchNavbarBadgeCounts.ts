import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { messages, notifications } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

/** Matches Laravel `notifications.notifiable_type` for users (`experience-api` notification resolver). */
const LARAVEL_USER_NOTIFIABLE_TYPE = 'App\\Models\\User'

export type NavbarBadgeCounts = {
  chatUnread: number
  announcementsUnread: number
}

type NotificationData = {
  entity?: string
  schedule_time?: string
}

async function countUnreadChatThreads(userId: number): Promise<number> {
  const threadRows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.userId, userId))

  let total = 0
  for (const { id } of threadRows) {
    const countRows = await db
      .select({ c: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          or(eq(messages.id, id), eq(messages.messageId, id)),
          ne(messages.authorId, userId),
          isNull(messages.readAt),
        ),
      )
    const c = Number(countRows[0]?.c ?? 0)
    if (c > 0) total++
  }
  return total
}

function countUnreadAnnouncementNotifications(
  rows: Array<{ data: string }>,
  currDateIST: Date,
): number {
  let n = 0
  for (const { data: raw } of rows) {
    let parsed: NotificationData
    try {
      parsed = JSON.parse(raw) as NotificationData
    } catch {
      continue
    }
    if (parsed.entity !== 'announcements') continue
    if (parsed.schedule_time) {
      const scheduleTime = new Date(parsed.schedule_time)
      if (scheduleTime >= currDateIST) continue
    }
    n++
  }
  return n
}

async function countUnreadAnnouncementsForUser(userId: number): Promise<number> {
  const currDateIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  const rows = await db
    .select({ data: notifications.data })
    .from(notifications)
    .where(
      and(
        eq(notifications.notifiableType, LARAVEL_USER_NOTIFIABLE_TYPE),
        eq(notifications.notifiableId, userId),
        isNull(notifications.readAt),
      ),
    )
  return countUnreadAnnouncementNotifications(rows, currDateIST)
}

/**
 * Navbar badges aligned with legacy student LMS:
 * - Chat: `getTotalUnreadMessages` (threads where another user has unread replies).
 * - Announcements: unread user notifications with `data.entity === 'announcements'` and schedule vs IST
 *   (same filter as `getAllNotifications` with `unread: true`).
 */
export const fetchNavbarBadgeCounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NavbarBadgeCounts> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      return { chatUnread: 0, announcementsUnread: 0 }
    }

    const [chatUnread, announcementsUnread] = await Promise.all([
      countUnreadChatThreads(userId),
      countUnreadAnnouncementsForUser(userId),
    ])

    return { chatUnread, announcementsUnread }
  },
)
