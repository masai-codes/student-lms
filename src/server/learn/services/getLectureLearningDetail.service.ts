import { and, eq, isNull, ne } from 'drizzle-orm'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

import { db } from '@/db'
import { lectures, lecturesAi, users } from '@/db/schema'
import { DISCUSSION_ENTITY_LECTURE } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsWithThreadsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity'
import { buildLectureVideoAttendanceState } from '@/server/learn/utils/buildLectureVideoAttendanceState'
import {
  buildLectureDetailPayload,
  isSupportedLectureDetailType,
} from '@/server/learn/utils/buildLectureDetailPayload'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { buildLectureTabContent } from '@/server/learn/utils/buildLectureTabContent'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import {
  getLectureAssociatedContent,
} from '@/server/learn/services/getLectureAssociatedContent.service'

export async function getLectureLearningDetailForUser(
  userId: number,
  lectureId: number,
): Promise<LectureDetailPayload> {
  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      week: lectures.week,
      module: lectures.module,
      batchId: lectures.batchId,
      sectionId: lectures.sectionId,
      hostName: users.name,
      hostAvatarUrl: users.profilePhotoPath,
      zoomLink: lectures.zoomLink,
      videos: lectures.videos,
      vimeoDownloadLinks: lectures.vimeoDownloadLinks,
      vimeoPlayerEmbedUrl: lectures.vimeoPlayerEmbedUrl,
      settings: lectures.settings,
      notes: lectures.notes,
      description: lectures.description,
      data: lectures.data,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        ne(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]

  if (!isSupportedLectureDetailType(row.type)) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    row.batchId,
    row.sectionId,
  )

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const [core, discussions, aiRows, associatedItems, videoAttendance] = await Promise.all([
    Promise.resolve(buildLearnDetailPresentation(row)),
    listDiscussionsWithThreadsForLearnEntity(
      userId,
      DISCUSSION_ENTITY_LECTURE,
      lectureId,
    ),
    db
      .select({
        summary: lecturesAi.summary,
        transcript: lecturesAi.transcript,
        transcriptSegments: lecturesAi.transcriptSegments,
        isSummaryPublished: lecturesAi.isSummaryPublished,
      })
      .from(lecturesAi)
      .where(eq(lecturesAi.lectureId, lectureId))
      .limit(1),
    getLectureAssociatedContent({
      lectureId,
      sectionId: row.sectionId,
      lectureData: row.data,
    }),
    buildLectureVideoAttendanceState(lectureId),
  ])

  const tabs = buildLectureTabContent({
    description: row.description,
    notes: row.notes,
    lecturesAi: aiRows[0] ?? null,
    associatedItems,
  })

  return buildLectureDetailPayload(
    { ...core, discussions },
    {
      type: row.type,
      schedule: row.schedule,
      concludes: row.concludes,
      zoomLink: row.zoomLink,
      videos: row.videos,
      vimeoDownloadLinks: row.vimeoDownloadLinks,
      vimeoPlayerEmbedUrl: row.vimeoPlayerEmbedUrl,
      settings: row.settings,
      hostAvatarUrl: row.hostAvatarUrl,
      notes: row.notes,
    },
    Date.now(),
    tabs,
    videoAttendance,
  )
}
