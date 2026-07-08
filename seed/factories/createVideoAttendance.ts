import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { videoAttendances } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type VideoAttendanceInsert = typeof videoAttendances.$inferInsert
type VideoAttendanceSelect = typeof videoAttendances.$inferSelect

export type CreateVideoAttendanceOverrides = Partial<Omit<VideoAttendanceInsert, 'id'>>

export async function createVideoAttendance(
  overrides: CreateVideoAttendanceOverrides = {},
): Promise<VideoAttendanceSelect> {
  const { lectureId, userId, hostId, batchId, sectionId } = overrides
  if (
    lectureId == null ||
    userId == null ||
    hostId == null ||
    batchId == null ||
    sectionId == null
  ) {
    throw new Error(
      'createVideoAttendance requires lectureId, userId, hostId, batchId, and sectionId',
    )
  }

  const schedule = overrides.schedule ?? formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))
  const values: VideoAttendanceInsert = {
    category: 'course',
    type: 'video',
    status: 1,
    duration: 100,
    schedule,
    ...overrides,
    lectureId,
    userId,
    hostId,
    batchId,
    sectionId,
  }

  const [result] = await db.insert(videoAttendances).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(videoAttendances)
    .where(eq(videoAttendances.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load video attendance after insert (id=${id})`)
  }

  return row
}
