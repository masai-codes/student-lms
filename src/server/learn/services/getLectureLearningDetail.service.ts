import { and, eq, isNull, ne } from 'drizzle-orm'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { DISCUSSION_ENTITY_LECTURE } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsForLearnEntity'
import {
  buildLectureDetailPayload,
  isSupportedLectureDetailType,
} from '@/server/learn/utils/buildLectureDetailPayload'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

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

  const core = buildLearnDetailPresentation(row)
  const discussions = await listDiscussionsForLearnEntity(
    userId,
    DISCUSSION_ENTITY_LECTURE,
    lectureId,
  )

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
    },
    Date.now(),
  )
}
