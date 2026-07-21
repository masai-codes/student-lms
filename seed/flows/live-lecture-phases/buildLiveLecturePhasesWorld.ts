import {
  createAssignment,
  createBatch,
  createEnrollment,
  createLecture,
  createLecturesAi,
  createProfile,
  createSection,
  createUser,
  createUserDeviceToken,
} from '../../factories'
import { DEFAULT_ZOOM_LINK } from '../../utils/constants'
import {
  addMinutes,
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { flowScopedEmail, ONBOARDING_PROFILE_PHOTO_URL } from '../onboarding-shared/constants'
import {
  LIVE_LECTURE_PHASES_FLOW_ID,
  LIVE_LECTURE_PHASES_TIMING,
  LIVE_LECTURE_RECORDING_HLS_URL,
  type LiveLecturePhasesFlowId,
} from './config'

import type { assignments, lectures, lecturesAi, sectionUser, sections } from '@/db/schema'

type LectureRow = typeof lectures.$inferSelect
type AssignmentRow = typeof assignments.$inferSelect
type LecturesAiRow = typeof lecturesAi.$inferSelect

export type LiveLecturePhaseKey =
  | 'beforeUnlock'
  | 'duringJoin'
  | 'afterNoRecording'
  | 'afterWithRecordingAttendanceOff'
  | 'afterWithRecordingAttendanceOn'
  | 'videoMandatory'
  | 'videoOptional'
  | 'optionalLiveBeforeUnlock'
  | 'optionalLiveDuringJoin'

export type LiveLecturePhasesWorld = {
  flowId: LiveLecturePhasesFlowId
  admin: Awaited<ReturnType<typeof createUser>>
  student: Awaited<ReturnType<typeof createUser>>
  batch: Awaited<ReturnType<typeof createBatch>>
  /** Primary section for the first three phase lectures. */
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  sections: {
    recordingAttendanceOff: typeof sections.$inferSelect
    recordingAttendanceOn: typeof sections.$inferSelect
  }
  enrollments: {
    recordingAttendanceOff: typeof sectionUser.$inferSelect
    recordingAttendanceOn: typeof sectionUser.$inferSelect
  }
  lectures: Record<LiveLecturePhaseKey, LectureRow>
  /** Companion lecture for the video-attendance-OFF recording. */
  attendanceOffExtras: {
    associatedLecture: LectureRow
  }
  /** Tab content for the video-attendance-ON recording lecture. */
  attendanceOnExtras: {
    lecturesAi: LecturesAiRow
    associatedLecture: LectureRow
    associatedNotesLecture: LectureRow
    associatedAssignment: AssignmentRow
  }
}

const SHARED_LECTURE_META = {
  category: 'live-session',
  module: 'JavaScript Fundamentals',
  type: 'live' as const,
  week: 2,
  day: 3,
  zoomLink: DEFAULT_ZOOM_LINK,
}

const SHARED_VIDEO_LECTURE_META = {
  category: 'course',
  module: 'JavaScript Fundamentals',
  type: 'video' as const,
  week: 2,
  day: 4,
  zoomLink: null,
}

const RECORDING_VIDEO_FIELDS = {
  videos: null,
  vimeoPlayerEmbedUrl: null,
  vimeoDownloadLinks: {
    gumlet: { hls_url: LIVE_LECTURE_RECORDING_HLS_URL },
  },
} as const

/** Low threshold so watching a short stretch during QA flips Present. */
const TEST_MINIMUM_VIDEO_WATCH_PERCENTAGE = 5

const SECTION_VIDEO_ATTENDANCE_OFF = {
  enableVideoAttendance: false,
  considerVideoAttendanceForActualAttendance: false,
} as const

const SECTION_VIDEO_ATTENDANCE_ON = {
  enableVideoAttendance: true,
  considerVideoAttendanceForActualAttendance: true,
  /** Required by `upgradeVideoAttendanceInline` to update `student_attendances`. */
  minimumVideoWatchPercentage: TEST_MINIMUM_VIDEO_WATCH_PERCENTAGE,
  catchUpDays: 7,
} as const

/** Markdown shown under the Description tab (`lectures.notes`). */
const ATTENDANCE_ON_NOTES = [
  '## Session notes',
  '',
  'Seeded notes for the **video attendance ON** recording lecture.',
  '',
  '- Closures and lexical scope',
  '- Array methods: `map`, `filter`, `reduce`',
  '- Common interview follow-ups',
  '',
  'Use this tab to verify Description / markdown rendering.',
].join('\n')

const ATTENDANCE_ON_AI_SUMMARY = [
  '## AI summary',
  '',
  'This lecture covers JavaScript fundamentals with a focus on closures and array methods.',
  '',
  '**Key takeaways**',
  '1. Closures capture variables from the enclosing scope.',
  '2. Prefer declarative array helpers over manual loops when transforming data.',
  '3. Watch enough of the recording (past the section threshold) to earn attendance credit.',
].join('\n')

const ATTENDANCE_ON_TRANSCRIPT_SEGMENTS = [
  {
    id: 0,
    start: 0,
    end: 4.2,
    text: 'Welcome back. Today we will revisit closures and array methods.',
  },
  {
    id: 1,
    start: 4.2,
    end: 9.5,
    text: 'A closure is a function that remembers the variables from its outer scope.',
  },
  {
    id: 2,
    start: 9.5,
    end: 15,
    text: 'Next, we will practice map, filter, and reduce on a small dataset.',
  },
] as const

function baseDescription(flowId: string, phaseLabel: string): string {
  return [
    `Seed flow: ${flowId}`,
    `Phase: ${phaseLabel}`,
    'Covers title, host, schedule/conclude (IST), category, module, mandatory flag, and description on the lecture detail page.',
  ].join('\n')
}

export async function buildLiveLecturePhasesWorld(
  flowId: LiveLecturePhasesFlowId = LIVE_LECTURE_PHASES_FLOW_ID,
): Promise<LiveLecturePhasesWorld> {
  const admin = await createUser({
    name: `Instructor Aditya [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: `Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  // Pre-complete guided-tour steps so lecture QA is not blocked by the overlay.
  await createProfile({
    userId: student.id,
    meta: { profile_pic: ONBOARDING_PROFILE_PHOTO_URL },
  })
  await createUserDeviceToken({
    userId: student.id,
    token: `seed-device-${flowId}`,
    deviceType: 'ios',
  })

  const batch = await createBatch({
    name: `Live Lecture Phases Batch [${flowId}]`,
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 7 })),
  })

  const section = await createSection({
    batchId: batch.id,
    name: `Live Lecture Section [${flowId}]`,
  })

  const enrollment = await createEnrollment({
    sectionId: section.id,
    userId: student.id,
    managerId: admin.id,
  })

  const sectionRecordingAttendanceOff = await createSection({
    batchId: batch.id,
    name: `Recording — video attendance OFF [${flowId}]`,
    settings: SECTION_VIDEO_ATTENDANCE_OFF,
  })

  const sectionRecordingAttendanceOn = await createSection({
    batchId: batch.id,
    name: `Recording — video attendance ON [${flowId}]`,
    settings: SECTION_VIDEO_ATTENDANCE_ON,
  })

  const enrollmentRecordingAttendanceOff = await createEnrollment({
    sectionId: sectionRecordingAttendanceOff.id,
    userId: student.id,
    managerId: admin.id,
  })

  const enrollmentRecordingAttendanceOn = await createEnrollment({
    sectionId: sectionRecordingAttendanceOn.id,
    userId: student.id,
    managerId: admin.id,
  })

  const duration = LIVE_LECTURE_PHASES_TIMING.lectureDurationMinutes

  const beforeSchedule = offsetFromNow({
    minutesFromNow: LIVE_LECTURE_PHASES_TIMING.beforeUnlockScheduleMinutesFromNow,
  })
  const beforeConcludes = addMinutes(beforeSchedule, duration)

  const duringSchedule = offsetFromNow({
    minutesFromNow: LIVE_LECTURE_PHASES_TIMING.duringJoinScheduleMinutesFromNow,
  })
  const duringConcludes = addMinutes(duringSchedule, duration)

  const afterSchedule = offsetFromNow({
    minutesAgo: LIVE_LECTURE_PHASES_TIMING.afterScheduleMinutesAgo,
  })
  const afterConcludes = offsetFromNow({
    minutesAgo: LIVE_LECTURE_PHASES_TIMING.afterConcludeMinutesAgo,
  })

  const beforeUnlock = await createLecture({
    ...SHARED_LECTURE_META,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Before unlock (>10 min to start)`,
    description: baseDescription(flowId, 'Before unlock — clock icon, lecture has not started'),
    optional: 0,
    schedule: formatMysqlDatetime(beforeSchedule),
    concludes: formatMysqlDatetime(beforeConcludes),
    startDate: formatMysqlDate(beforeSchedule),
    endDate: formatMysqlDate(beforeConcludes),
  })

  const duringJoin = await createLecture({
    ...SHARED_LECTURE_META,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] During join window (5 min before → conclude + 30 min)`,
    description: baseDescription(flowId, 'During — video icon, join button, mute reminder'),
    optional: 0,
    schedule: formatMysqlDatetime(duringSchedule),
    concludes: formatMysqlDatetime(duringConcludes),
    startDate: formatMysqlDate(duringSchedule),
    endDate: formatMysqlDate(duringConcludes),
  })

  const optionalLiveBeforeUnlock = await createLecture({
    ...SHARED_LECTURE_META,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Optional live — before unlock (>10 min to start)`,
    description: baseDescription(
      flowId,
      'Optional live — clock / not started yet; Recommended chip (no attendance badge)',
    ),
    optional: 1,
    schedule: formatMysqlDatetime(beforeSchedule),
    concludes: formatMysqlDatetime(beforeConcludes),
    startDate: formatMysqlDate(beforeSchedule),
    endDate: formatMysqlDate(beforeConcludes),
  })

  const optionalLiveDuringJoin = await createLecture({
    ...SHARED_LECTURE_META,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Optional live — during join window`,
    description: baseDescription(
      flowId,
      'Optional live — join button active; Recommended chip (no attendance badge)',
    ),
    optional: 1,
    schedule: formatMysqlDatetime(duringSchedule),
    concludes: formatMysqlDatetime(duringConcludes),
    startDate: formatMysqlDate(duringSchedule),
    endDate: formatMysqlDate(duringConcludes),
  })

  const videoMandatory = await createLecture({
    ...SHARED_VIDEO_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Video lecture — mandatory (playable)`,
    description: baseDescription(
      flowId,
      'type=video · mandatory · schedule in the past → player unlocked',
    ),
    optional: 0,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
  })

  const videoOptional = await createLecture({
    ...SHARED_VIDEO_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Video lecture — optional (playable)`,
    description: baseDescription(
      flowId,
      'type=video · optional/recommended · schedule in the past → player unlocked',
    ),
    optional: 1,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
  })

  const afterNoRecording = await createLecture({
    ...SHARED_LECTURE_META,
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] After lecture (recording not available yet)`,
    description: baseDescription(flowId, 'After — blank video area, recording processing'),
    optional: 1,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
    videos: null,
    vimeoPlayerEmbedUrl: null,
    vimeoDownloadLinks: null,
  })

  const afterWithRecordingAttendanceOff = await createLecture({
    ...SHARED_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOff.id,
    userId: admin.id,
    title: `[${flowId}] After lecture — recording available (video attendance OFF)`,
    description: baseDescription(
      flowId,
      'Recording player + disclaimer: recording does not count toward attendance',
    ),
    optional: 0,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
  })

  const associatedLectureAttendanceOff = await createLecture({
    ...SHARED_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOff.id,
    userId: admin.id,
    title: `[${flowId}] Associated lecture — follow-up: DOM APIs`,
    description:
      'Companion live lecture linked from the video-attendance-OFF recording (Associated Content tab).',
    notes: '## Follow-up session\n\nCovers DOM querying, events, and common browser APIs after the main recording.',
    optional: 1,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
    data: {
      associatedLecture: { id: afterWithRecordingAttendanceOff.id },
    },
  })

  const afterWithRecordingAttendanceOn = await createLecture({
    ...SHARED_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOn.id,
    userId: admin.id,
    title: `[${flowId}] After lecture — recording available (video attendance ON)`,
    description: baseDescription(
      flowId,
      'Recording player + disclaimer: watch full recording for attendance credit',
    ),
    notes: ATTENDANCE_ON_NOTES,
    optional: 0,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
  })

  const attendanceOnAi = await createLecturesAi({
    lectureId: afterWithRecordingAttendanceOn.id,
    summary: ATTENDANCE_ON_AI_SUMMARY,
    transcript: ATTENDANCE_ON_TRANSCRIPT_SEGMENTS.map(segment => segment.text).join('\n\n'),
    transcriptSegments: [...ATTENDANCE_ON_TRANSCRIPT_SEGMENTS],
    isSummaryPublished: 1,
  })

  const associatedLecture = await createLecture({
    ...SHARED_LECTURE_META,
    ...RECORDING_VIDEO_FIELDS,
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOn.id,
    userId: admin.id,
    title: `[${flowId}] Associated lecture — follow-up: async JS`,
    description:
      'Companion live lecture linked from the video-attendance-ON recording (Associated Content tab).',
    notes: '## Follow-up session\n\nCovers promises, async/await, and common pitfalls after the main recording.',
    optional: 1,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
    data: {
      associatedLecture: { id: afterWithRecordingAttendanceOn.id },
    },
  })

  const associatedNotesLecture = await createLecture({
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOn.id,
    userId: admin.id,
    title: `[${flowId}] Associated notes — closures cheat sheet`,
    category: 'notes',
    type: 'reading',
    module: 'JavaScript Fundamentals',
    description: 'Companion notes linked from the video-attendance-ON recording lecture.',
    notes: '## Closures cheat sheet\n\n- Outer scope variables stay alive after the outer function returns.\n- Useful for private state and partial application.',
    optional: 1,
    week: 2,
    day: 3,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(afterConcludes),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
    zoomLink: null,
    data: {
      associatedLecture: { id: afterWithRecordingAttendanceOn.id },
    },
  })

  const associatedAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: sectionRecordingAttendanceOn.id,
    userId: admin.id,
    title: `[${flowId}] Associated assignment — array methods drill`,
    category: 'coding',
    type: 'assignment',
    module: 'JavaScript Fundamentals',
    instructions: 'Practice map/filter/reduce after watching the recording.',
    optional: 0,
    week: 2,
    day: 3,
    schedule: formatMysqlDatetime(afterSchedule),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -3 })),
    startDate: formatMysqlDate(afterSchedule),
    endDate: formatMysqlDate(afterConcludes),
    data: {
      associatedLecture: { id: afterWithRecordingAttendanceOn.id },
    },
  })

  return {
    flowId,
    admin,
    student,
    batch,
    section,
    enrollment,
    sections: {
      recordingAttendanceOff: sectionRecordingAttendanceOff,
      recordingAttendanceOn: sectionRecordingAttendanceOn,
    },
    enrollments: {
      recordingAttendanceOff: enrollmentRecordingAttendanceOff,
      recordingAttendanceOn: enrollmentRecordingAttendanceOn,
    },
    lectures: {
      beforeUnlock,
      duringJoin,
      afterNoRecording,
      afterWithRecordingAttendanceOff,
      afterWithRecordingAttendanceOn,
      videoMandatory,
      videoOptional,
      optionalLiveBeforeUnlock,
      optionalLiveDuringJoin,
    },
    attendanceOffExtras: {
      associatedLecture: associatedLectureAttendanceOff,
    },
    attendanceOnExtras: {
      lecturesAi: attendanceOnAi,
      associatedLecture,
      associatedNotesLecture,
      associatedAssignment,
    },
  }
}
