import { and, eq, isNull, ne } from 'drizzle-orm'

import type { LectureSupportSnapshot } from '@/server/api/support/support.types'
import { db } from '@/db'
import { lectures, lecturesAi } from '@/db/schema'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { buildLectureVideoAttendanceState } from '@/server/learn/utils/buildLectureVideoAttendanceState'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { parseLectureTranscriptSegments } from '@/server/learn/utils/formatLectureTranscript'
import {
  resolveModuleName,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { toSupportLectureDisplayType } from '@/lib/support/lectureDisplayType'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { normalizeLectureKind } from '@/server/learn/utils/normalizeLectureKind'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'
import { resolveAiSummaryStatus } from '@/server/learn/utils/resolveAiSummaryStatus'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveLectureDuration } from '@/server/learn/utils/resolveLectureDuration'
import { resolveLectureRecordingForSupport } from '@/server/learn/utils/resolveLectureRecordingForSupport'
import { resolveLiveLecturePhase } from '@/server/learn/utils/resolveLiveLecturePhase'
import { resolveVideoLecturePhase } from '@/server/learn/utils/resolveVideoLecturePhase'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

export async function getLectureSupportSnapshot(
  userId: number,
  lectureId: number,
): Promise<LectureSupportSnapshot> {
  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      week: lectures.week,
      module: lectures.module,
      sectionId: lectures.sectionId,
      zoomLink: lectures.zoomLink,
      videos: lectures.videos,
      vimeoDownloadLinks: lectures.vimeoDownloadLinks,
      settings: lectures.settings,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, lectureId),
        isNull(lectures.deletedAt),
        ne(lectures.type, LECTURE_RESOURCE_TYPE),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUPPORT_LECTURE_NOT_FOUND')
  }

  const row = rows[0]
  const lectureKind = normalizeLectureKind(row.type)
  if (lectureKind == null) {
    throw new Error('SUPPORT_LECTURE_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.sectionId)
  if (!allowed) {
    throw new Error('SUPPORT_LECTURE_NOT_FOUND')
  }

  const nowMs = Date.now()
  const settings = parseLectureSettings(row.settings)
  const priority = toLearningPriority(row.optional)
  const isMandatory = priority === 'mandatory'
  const isOptional = priority === 'recommended'

  const livePhase =
    lectureKind === 'live'
      ? resolveLiveLecturePhase({
          schedule: row.schedule,
          concludes: row.concludes,
          nowMs,
        })
      : null

  const videoPhase =
    lectureKind === 'video'
      ? resolveVideoLecturePhase({ schedule: row.schedule, nowMs })
      : null

  const joinLiveButtonState =
    lectureKind === 'live'
      ? resolveJoinLiveButtonState({
          schedule: row.schedule,
          concludes: row.concludes,
          nowMs,
          zoomLink: row.zoomLink,
        })
      : null

  const [aiRows, videoAttendance, attendanceMap] = await Promise.all([
    db
      .select({
        summary: lecturesAi.summary,
        isSummaryPublished: lecturesAi.isSummaryPublished,
        transcriptSegments: lecturesAi.transcriptSegments,
      })
      .from(lecturesAi)
      .where(eq(lecturesAi.lectureId, lectureId))
      .limit(1),
    buildLectureVideoAttendanceState(userId, lectureId),
    row.sectionId != null
      ? fetchLectureAttendanceSummaries(
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
          nowMs,
          true,
        )
      : Promise.resolve(new Map()),
  ])

  const aiRow = aiRows[0] ?? null
  const transcriptSegments = aiRow
    ? parseLectureTranscriptSegments(aiRow.transcriptSegments)
    : []

  const recording = await resolveLectureRecordingForSupport({
    zoomLink: row.zoomLink,
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
    vimeoDownloadLinks: row.vimeoDownloadLinks,
    videos: row.videos,
    hideVideo: settings.hideVideo,
    lectureKind,
    livePhase,
    videoPhase,
  })

  const duration = await resolveLectureDuration({
    recordingUrl: recording.recordingUrl,
    recordingVerified: recording.recordingVerified,
    transcriptSegments,
    schedule: row.schedule,
    concludes: row.concludes,
    videoProgressDurationSeconds: videoAttendance?.totalDuration ?? null,
  })

  const sessionEnded = isLectureSessionEnded({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
  })

  const showAttendance = sessionEnded
  const attendance = showAttendance
    ? (attendanceMap.get(lectureId) ?? null)
    : null

  return {
    lectureId,
    lectureKind,
    title: row.title.trim() || 'Untitled lecture',
    meta: resolveModuleName(row.module, row.week),
    date: row.schedule ? formatSocialPostTime(row.schedule) : 'No schedule',
    lectureDisplayType: toSupportLectureDisplayType(row.type),
    schedule: row.schedule,
    isMandatory,
    isOptional,
    livePhase,
    videoPhase,
    joinLiveButtonState,
    isSessionPending: recording.recordingStatus === 'pending',
    recordingStatus: recording.recordingStatus,
    recordingUrl: recording.recordingUrl,
    durationSeconds: duration.durationSeconds,
    durationSource: duration.durationSource,
    aiSummaryStatus: resolveAiSummaryStatus(aiRow),
    attendance,
    showAttendance,
  }
}
