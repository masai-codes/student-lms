import { and, eq, isNull, ne, sql } from 'drizzle-orm'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

import { db } from '@/db'
import {
  lectures,
  lecturesAi,
  lectureZoomChat,
  sections,
  users,
} from '@/db/schema'
import { DISCUSSION_ENTITY_LECTURE } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsWithThreadsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { buildLectureVideoAttendanceState } from '@/server/learn/utils/buildLectureVideoAttendanceState'
import { toLearningPriority } from '@/server/learn/utils/learningDataMappers'
import { resolveEnableZoomWebView } from '@/server/learn/utils/resolveEnableZoomWebView'
import {
  buildLectureDetailPayload,
  isSupportedLectureDetailType,
} from '@/server/learn/utils/buildLectureDetailPayload'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { buildLectureTabContent } from '@/server/learn/utils/buildLectureTabContent'
import { getLearnEntityBookmarkState } from '@/server/learn/services/learnEntityBookmark.service'
import { getLectureFeedbackRecord } from '@/server/learn/services/lectureFeedback.service'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { resolveLearnDetailRestriction } from '@/server/restrictions/resolveLearnDetailRestriction'
import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import { getAllAssociatedEntities } from '@/server/learn/services/getAllAssociatedEntities.service'

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
      isNewZoomRedirection: lectures.isNewZoomRedirection,
      sectionSettings: sections.settings,
      data: lectures.data,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .leftJoin(sections, eq(lectures.sectionId, sections.id))
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

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const isRecommended = toLearningPriority(row.optional) === 'recommended'

  const [
    core,
    discussions,
    aiRows,
    zoomChatRows,
    associatedItems,
    videoAttendance,
    attendanceMap,
    isBookmarked,
    feedbackRecord,
  ] = await Promise.all([
    Promise.resolve(buildLearnDetailPresentation(row)),
    listDiscussionsWithThreadsForLearnEntity(
      userId,
      DISCUSSION_ENTITY_LECTURE,
      lectureId,
    ),
    db
      .select({
        summary: lecturesAi.summary,
        // Ask MySQL whether a transcript exists instead of selecting it (#353):
        // long lectures store megabytes here, and the page only needs to know
        // whether the CC button and Transcript tab have anything to offer. An
        // emptiness test can't be expressed with the query builder, hence `sql`.
        // The clients treat this as a hint — a 404 from the cache endpoint still
        // renders the normal empty state.
        hasTranscript: sql<number>`(
          char_length(coalesce(${lecturesAi.transcript}, '')) > 0
          or coalesce(json_length(${lecturesAi.transcriptSegments}), 0) > 0
        )`,
      })
      .from(lecturesAi)
      .where(eq(lecturesAi.lectureId, lectureId))
      .limit(1),
    db
      .select({ finalChat: lectureZoomChat.finalChat })
      .from(lectureZoomChat)
      .where(eq(lectureZoomChat.lectureId, lectureId))
      .limit(1),
    getAllAssociatedEntities({
      entityId: lectureId,
      entityKind: 'lecture',
      sectionId: row.sectionId,
      entityData: row.data,
      userId,
      nowMs: Date.now(),
    }),
    buildLectureVideoAttendanceState(userId, lectureId),
    row.sectionId == null
      ? Promise.resolve(new Map())
      : fetchLectureAttendanceSummaries(
          userId,
          [
            {
              lectureId,
              sectionId: row.sectionId,
              schedule: row.schedule,
              concludes: row.concludes,
              optional: row.optional,
            },
          ],
          Date.now(),
          // Compute for optional lectures too so the info tooltip has data.
          isRecommended,
        ),
    getLearnEntityBookmarkState(userId, 'lecture', lectureId),
    getLectureFeedbackRecord(userId, lectureId),
  ])

  const attendanceSummary = attendanceMap.get(lectureId) ?? null
  const attendance = isRecommended ? null : attendanceSummary
  const optionalAttendance = isRecommended ? attendanceSummary : null

  const aiRow = aiRows[0]

  const tabs = buildLectureTabContent({
    notes: row.notes,
    zoomChatFinalChat: zoomChatRows[0]?.finalChat ?? null,
    lecturesAi:
      aiRow != null
        ? {
            summary: aiRow.summary,
            hasTranscript: Number(aiRow.hasTranscript) > 0,
          }
        : null,
    associatedItems,
    lectureId,
    batchId: row.batchId,
    sectionId: row.sectionId,
  })

  const payload = buildLectureDetailPayload(
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
    attendance,
    optionalAttendance,
    feedbackRecord,
  )

  const [restrictions, sectionBatchId] = await Promise.all([
    getUserBatchRestrictions(userId),
    getBatchIdForSection(row.sectionId),
  ])
  // Agreement ban restricts a lecture only when the page would show a recording;
  // live lectures without a recording stay accessible.
  const restriction = resolveLearnDetailRestriction({
    contentBatchId: sectionBatchId ?? row.batchId,
    schedule: row.schedule,
    restrictions,
    agreementScope: payload.hasRecording ? 'recording' : null,
  })

  return {
    ...payload,
    isBookmarked,
    isNewZoomRedirection: row.isNewZoomRedirection === 1,
    enableZoomWebView: resolveEnableZoomWebView(row.sectionSettings),
    restriction,
    // When restricted the whole page is blocked client-side; don't leak the
    // recording URL either way.
    ...(restriction != null ? { videoUrl: null, hasRecording: false } : {}),
  }
}
