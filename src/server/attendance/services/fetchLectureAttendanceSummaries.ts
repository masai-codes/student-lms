import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import {
  lectures,
  sections,
  studentAttendances,
  videoAttendances,
} from '@/db/schema'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { buildLectureAttendanceSummary } from '@/server/attendance/utils/buildLectureAttendanceSummary'

export type LectureAttendanceFetchInput = {
  lectureId: number
  sectionId: number
  schedule: string | null
  concludes: string | null
  optional: number | null
}

function isOptionalLecture(optional: number | null): boolean {
  return optional === 1
}

export async function fetchLectureAttendanceSummaries(
  userId: number,
  lectureInputs: Array<LectureAttendanceFetchInput>,
  nowMs = Date.now(),
  /**
   * Optional lectures are excluded by default because their attendance is not
   * scored into the regular badge/CTA. Pass `true` to also compute summaries
   * for optional lectures (used to power the optional-session info tooltip).
   */
  includeOptional = false,
): Promise<Map<number, LectureAttendanceSummary>> {
  const eligibleLectures = includeOptional
    ? lectureInputs
    : lectureInputs.filter((lecture) => !isOptionalLecture(lecture.optional))

  if (eligibleLectures.length === 0) {
    return new Map()
  }

  const lectureIds = eligibleLectures.map((lecture) => lecture.lectureId)

  const [sectionRows, attendanceRows, videoProgressRows] = await Promise.all([
    db
      .select({
        lectureId: lectures.id,
        schedule: lectures.schedule,
        concludes: lectures.concludes,
        sectionId: lectures.sectionId,
        sectionSettings: sections.settings,
      })
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .where(inArray(lectures.id, lectureIds)),
    db
      .select({
        lectureId: studentAttendances.lectureId,
        status: studentAttendances.status,
        videoPercentage: studentAttendances.videoPercentage,
        includeVideoAttendance: studentAttendances.includeVideoAttendance,
        catchUpDays: studentAttendances.catchUpDays,
        lateByMinutes: studentAttendances.lateByMinutes,
        liveAttendanceStatus: studentAttendances.liveAttendanceStatus,
        videoAttendanceStatus: studentAttendances.videoAttendanceStatus,
        meta: studentAttendances.meta,
      })
      .from(studentAttendances)
      .where(
        and(
          eq(studentAttendances.userId, userId),
          inArray(studentAttendances.lectureId, lectureIds),
        ),
      ),
    // Live recording watch progress — same source (`video_attendances.duration`)
    // the lecture detail reads, so listing/dashboard cards resolve to the same
    // watch state instead of the possibly-stale `student_attendances` value.
    // Uses the (user_id, lecture_id) index.
    db
      .select({
        lectureId: videoAttendances.lectureId,
        duration: videoAttendances.duration,
      })
      .from(videoAttendances)
      .where(
        and(
          eq(videoAttendances.userId, userId),
          inArray(videoAttendances.lectureId, lectureIds),
        ),
      ),
  ])

  const attendanceByLectureId = new Map(
    attendanceRows.map((row) => [row.lectureId, row]),
  )

  const watchPercentageByLectureId = new Map(
    videoProgressRows.map((row) => [row.lectureId, row.duration ?? 0]),
  )

  const summaries = new Map<number, LectureAttendanceSummary>()

  for (const lecture of sectionRows) {
    if (lecture.sectionId == null) {
      continue
    }
    const record = attendanceByLectureId.get(lecture.lectureId) ?? null
    summaries.set(
      lecture.lectureId,
      buildLectureAttendanceSummary(
        {
          lectureId: lecture.lectureId,
          sectionId: lecture.sectionId,
          schedule: lecture.schedule,
          concludes: lecture.concludes,
          sectionSettings: lecture.sectionSettings,
        },
        record,
        nowMs,
        watchPercentageByLectureId.get(lecture.lectureId) ?? 0,
      ),
    )
  }

  return summaries
}
