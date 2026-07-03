import {
  createBatch,
  createEnrollment,
  createLecture,
  createSection,
  createUser,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_STUDENT_EMAIL,
  DEFAULT_ZOOM_LINK,
  DEV_PASSWORD_PLAINTEXT,
} from '../../utils/constants'
import {
  addMinutes,
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { loginAndJoinLectureConfig, loginAndJoinLectureTiming } from './config'

function buildTestUsers(
  admin: SeedFlowResult['entities']['admin'],
  student: SeedFlowResult['entities']['student'],
): TestUser[] {
  return [
    {
      role: 'admin',
      email: admin.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: admin.id,
      name: admin.name,
    },
    {
      role: 'student',
      email: student.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: student.id,
      name: student.name,
    },
  ]
}

export async function seedLoginAndJoinLecture(): Promise<SeedFlowResult> {
  const batchStart = offsetFromNow({
    daysAgo: loginAndJoinLectureTiming.batchStartedDaysAgo,
  })
  const lectureSchedule = offsetFromNow({
    minutesAgo: loginAndJoinLectureTiming.lectureScheduledMinutesAgo,
  })
  const lectureConcludes = addMinutes(
    lectureSchedule,
    loginAndJoinLectureTiming.lectureDurationMinutes,
  )

  const admin = await createUser({
    name: 'Admin User',
    email: DEFAULT_ADMIN_EMAIL,
    role: 'admin',
  })

  const student = await createUser({
    name: 'Student User',
    email: DEFAULT_STUDENT_EMAIL,
    role: 'student',
  })

  const batch = await createBatch({
    starting: formatMysqlDate(batchStart),
  })

  const section = await createSection({ batchId: batch.id })

  const enrollment = await createEnrollment({
    sectionId: section.id,
    userId: student.id,
    managerId: admin.id,
  })

  const lecture = await createLecture({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    schedule: formatMysqlDatetime(lectureSchedule),
    concludes: formatMysqlDatetime(lectureConcludes),
    zoomLink: DEFAULT_ZOOM_LINK,
  })

  return {
    flowId: loginAndJoinLectureConfig.id,
    entities: { admin, student, batch, section, enrollment, lecture },
    testUsers: buildTestUsers(admin, student),
    timing: {
      batchStarting: formatMysqlDate(batchStart),
      lectureSchedule: formatMysqlDatetime(lectureSchedule),
      lectureConcludes: formatMysqlDatetime(lectureConcludes),
    },
  }
}
