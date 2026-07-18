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
  ]
}

export async function seedLiveLecturePhases(): Promise<SeedFlowResult> {
  const world = await buildLiveLecturePhasesWorld()

  const duration = LIVE_LECTURE_PHASES_TIMING.lectureDurationMinutes
  const beforeSchedule = offsetFromNow({
    minutesFromNow: LIVE_LECTURE_PHASES_TIMING.beforeUnlockScheduleMinutesFromNow,
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
      batch: world.batch,
      section: world.section,
      enrollment: world.enrollment,
      sections: world.sections,
      enrollments: world.enrollments,
      lectures: world.lectures,
      attendanceOffExtras: world.attendanceOffExtras,
      attendanceOnExtras: world.attendanceOnExtras,
    },
    testUsers: buildTestUsers(world),
    timing: {
      beforeUnlockSchedule: formatMysqlDatetime(beforeSchedule),
      beforeUnlockConcludes: formatMysqlDatetime(addMinutes(beforeSchedule, duration)),
      duringJoinSchedule: formatMysqlDatetime(duringSchedule),
      duringJoinConcludes: formatMysqlDatetime(addMinutes(duringSchedule, duration)),
      afterNoRecordingSchedule: formatMysqlDatetime(afterSchedule),
      afterNoRecordingConcludes: formatMysqlDatetime(afterConcludes),
      afterWithRecordingSchedule: formatMysqlDatetime(afterSchedule),
      afterWithRecordingConcludes: formatMysqlDatetime(afterConcludes),
    },
  }
}
