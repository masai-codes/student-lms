import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { announcementReads } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type AnnouncementReadInsert = typeof announcementReads.$inferInsert
type AnnouncementReadSelect = typeof announcementReads.$inferSelect

export type CreateAnnouncementReadOverrides = Partial<
  Omit<AnnouncementReadInsert, 'id'>
>

export async function createAnnouncementRead(
  overrides: CreateAnnouncementReadOverrides = {},
): Promise<AnnouncementReadSelect> {
  const { announcementId, userId } = overrides
  if (announcementId == null || userId == null) {
    throw new Error('createAnnouncementRead requires announcementId and userId')
  }

  const values: AnnouncementReadInsert = {
    readAt: formatMysqlDatetime(offsetFromNow({ minutesAgo: 10 })),
    isUnread: 0,
    ...overrides,
    announcementId,
    userId,
  }

  const [result] = await db.insert(announcementReads).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(announcementReads)
    .where(eq(announcementReads.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load announcement read after insert (id=${id})`)
  }

  return row
}
