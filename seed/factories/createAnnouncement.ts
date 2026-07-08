import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { announcements } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type AnnouncementInsert = typeof announcements.$inferInsert
type AnnouncementSelect = typeof announcements.$inferSelect

export type CreateAnnouncementOverrides = Partial<Omit<AnnouncementInsert, 'id'>>

export async function createAnnouncement(
  overrides: CreateAnnouncementOverrides = {},
): Promise<AnnouncementSelect> {
  const { userId, batchId, sectionId } = overrides
  if (userId == null || batchId == null || sectionId == null) {
    throw new Error('createAnnouncement requires userId, batchId, and sectionId')
  }

  const values: AnnouncementInsert = {
    subject: 'Announcement',
    body: 'Announcement body for local testing.',
    type: 'announcement',
    category: 'general',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 30 })),
    trackRead: 1,
    ...overrides,
    userId,
    batchId,
    sectionId,
  }

  const [result] = await db.insert(announcements).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load announcement after insert (id=${id})`)
  }

  return row
}
