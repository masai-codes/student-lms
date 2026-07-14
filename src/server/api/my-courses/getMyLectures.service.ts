import { and, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

export interface MyCoursesItem {
  batchId: number
  courseTitle: string
  instituteName: string
  courseLogo: string | null
  courseProgress: number
}

function computeProgress(timeline: unknown[]): number {
  if (timeline.length === 0) return 0
  const now = Date.now()
  const completed = timeline.filter((t) => {
    const item = t as Record<string, unknown>
    const dateStr = (item.timeLine ?? item.date ?? '') as string
    return dateStr && new Date(dateStr).getTime() <= now
  }).length
  return Math.round((completed / timeline.length) * 100)
}

export async function getMyCourses(userId: number): Promise<MyCoursesItem[]> {
  // Single source of truth for enrolled batches (section-based, portal-scoped,
  // cancelled batches already excluded).
  const orderedBatchIds = await getBatchIdsForEnrolledUser(userId)

  if (orderedBatchIds.length === 0) return []

  const batchRows = await db
    .select({ id: batches.id, name: batches.name, meta: batches.meta })
    .from(batches)
    .where(and(inArray(batches.id, orderedBatchIds), isNull(batches.deletedAt)))

  const batchMap = new Map(batchRows.map((b) => [b.id, b]))

  return orderedBatchIds.flatMap((batchId) => {
    const b = batchMap.get(batchId)
    if (!b) return []
    const meta = (b.meta ?? {}) as Record<string, unknown>
    const timeline = Array.isArray(meta.courseTimeline)
      ? (meta.courseTimeline as unknown[])
      : []
    const title =
      typeof meta.courseTitle === 'string' && meta.courseTitle
        ? meta.courseTitle
        : b.name
    const institute =
      typeof meta.instituteName === 'string' && meta.instituteName
        ? meta.instituteName
        : typeof meta.institute === 'string'
          ? meta.institute
          : ''
    const logo =
      typeof meta.courseLogo === 'string' && meta.courseLogo
        ? meta.courseLogo
        : null
    return [
      {
        batchId: b.id,
        courseTitle: title,
        instituteName: institute,
        courseLogo: logo,
        courseProgress: computeProgress(timeline),
      },
    ]
  })
}
