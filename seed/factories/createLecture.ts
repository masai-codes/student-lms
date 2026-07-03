import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { lectures } from '@/db/schema'

import { DEFAULT_ZOOM_LINK } from '../utils/constants'
import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type LectureInsert = typeof lectures.$inferInsert
type LectureSelect = typeof lectures.$inferSelect

export type CreateLectureOverrides = Partial<Omit<LectureInsert, 'id'>>

export async function createLecture(
  overrides: CreateLectureOverrides = {},
): Promise<LectureSelect> {
  if (overrides.batchId == null || overrides.sectionId == null || overrides.userId == null) {
    throw new Error('createLecture requires batchId, sectionId, and userId')
  }

  const schedule = overrides.schedule ?? formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))

  const values: LectureInsert = {
    title: 'Intro to JavaScript',
    category: 'course',
    type: 'live',
    description: 'Overview of JS fundamentals for the cohort.',
    optional: 0,
    week: 1,
    day: 1,
    schedule,
    zoomLink: DEFAULT_ZOOM_LINK,
    ...overrides,
  }

  const [result] = await db.insert(lectures).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(lectures).where(eq(lectures.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load lecture after insert (id=${id})`)
  }

  return row
}
