import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import {
  addMinutes,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { buildLiveLecturePhasesWorld } from './buildLiveLecturePhasesWorld'
import { liveLecturePhasesConfig, LIVE_LECTURE_PHASES_TIMING } from './config'

function buildTestUsers(
  world: Awaited<ReturnType<typeof buildLiveLecturePhasesWorld>>,
): TestUser[] {
  return [
    {
      role: 'admin',
      email: world.admin.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.admin.id,
      name: world.admin.name,
    },
    {
      role: 'student',
      email: world.student.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.student.id,
      name: world.student.name,
    },
    {
      role: 'student',
      email: world.student2.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.student2.id,
      name: world.student2.name,
    },
    {
      role: 'student',
      email: world.student3.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.student3.id,
      name: world.student3.name,
    },
  ]
}

export async function seedLiveLecturePhases(): Promise<SeedFlowResult> {
  const world = await buildLiveLecturePhasesWorld()

  const duration = LIVE_LECTURE_PHASES_TIMING.lectureDurationMinutes
  const beforeSchedule = offsetFromNow({
    minutesFromNow:
      LIVE_LECTURE_PHASES_TIMING.beforeUnlockScheduleMinutesFromNow,
  })
  const duringSchedule = offsetFromNow({
    minutesFromNow: LIVE_LECTURE_PHASES_TIMING.duringJoinScheduleMinutesFromNow,
  })
  const afterSchedule = offsetFromNow({
    minutesAgo: LIVE_LECTURE_PHASES_TIMING.afterScheduleMinutesAgo,
  })
  const afterConcludes = offsetFromNow({
    minutesAgo: LIVE_LECTURE_PHASES_TIMING.afterConcludeMinutesAgo,
  })

  return {
    flowId: liveLecturePhasesConfig.id,
    entities: {
      admin: world.admin,
      student: world.student,
      student2: world.student2,
      student3: world.student3,
      batch: world.batch,
      section: world.section,
      enrollment: world.enrollment,
      enrollmentStudent2: world.enrollmentStudent2,
      enrollmentStudent3: world.enrollmentStudent3,
      sections: world.sections,
      enrollments: world.enrollments,
      lectures: world.lectures,
      transcriptExtras: world.transcriptExtras,
      attendanceOffExtras: world.attendanceOffExtras,
      attendanceOnExtras: world.attendanceOnExtras,
      discussions: world.discussions,
    },
    testUsers: buildTestUsers(world),
    timing: {
      beforeUnlockSchedule: formatMysqlDatetime(beforeSchedule),
      beforeUnlockConcludes: formatMysqlDatetime(
        addMinutes(beforeSchedule, duration),
      ),
      duringJoinSchedule: formatMysqlDatetime(duringSchedule),
      duringJoinConcludes: formatMysqlDatetime(
        addMinutes(duringSchedule, duration),
      ),
      afterNoRecordingSchedule: formatMysqlDatetime(afterSchedule),
      afterNoRecordingConcludes: formatMysqlDatetime(afterConcludes),
      afterWithRecordingSchedule: formatMysqlDatetime(afterSchedule),
      afterWithRecordingConcludes: formatMysqlDatetime(afterConcludes),
    },
  }
}
