import {
  createBatch,
  createEnrollment,
  createLecture,
  createSection,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import {
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { buildLiveLecturePhasesWorld } from '../live-lecture-phases/buildLiveLecturePhasesWorld'
import {
  multiProgramStudentConfig,
  MULTI_PROGRAM_STUDENT_FLOW_ID,
} from './config'

const SECOND_PROGRAM_NAME = 'Data Science'

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

/**
 * Reuses the live-lecture-phases world (program: SDE) as the student's first
 * batch, then enrolls the same student into a second batch/program (Data
 * Science) with its own section and lecture — so `getEnrolledBatchesForUser`
 * returns two batches and the `/learn` batch switcher has something to switch
 * between.
 */
export async function seedMultiProgramStudent(): Promise<SeedFlowResult> {
  const world = await buildLiveLecturePhasesWorld(MULTI_PROGRAM_STUDENT_FLOW_ID)

  const secondBatchStarting = offsetFromNow({ daysAgo: 14 })

  const secondBatch = await createBatch({
    name: `Data Science Batch [${MULTI_PROGRAM_STUDENT_FLOW_ID}]`,
    program: SECOND_PROGRAM_NAME,
    duration: '24 weeks',
    starting: formatMysqlDate(secondBatchStarting),
  })

  const secondSection = await createSection({
    batchId: secondBatch.id,
    name: `Data Science Section [${MULTI_PROGRAM_STUDENT_FLOW_ID}]`,
  })

  const secondEnrollment = await createEnrollment({
    sectionId: secondSection.id,
    userId: world.student.id,
    managerId: world.admin.id,
  })

  const secondLectureSchedule = offsetFromNow({ daysAgo: 1 })

  const secondBatchLecture = await createLecture({
    batchId: secondBatch.id,
    sectionId: secondSection.id,
    userId: world.admin.id,
    title: `[${MULTI_PROGRAM_STUDENT_FLOW_ID}] Data Science — Intro to Pandas`,
    category: 'course',
    module: 'Data Analysis',
    type: 'video',
    description:
      'Second-program lecture used to verify batch switching on /learn.',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(secondLectureSchedule),
    startDate: formatMysqlDate(secondLectureSchedule),
    zoomLink: null,
  })

  return {
    flowId: multiProgramStudentConfig.id,
    entities: {
      admin: world.admin,
      student: world.student,
      batch: world.batch,
      section: world.section,
      enrollment: world.enrollment,
      sections: world.sections,
      enrollments: world.enrollments,
      lectures: world.lectures,
      transcriptExtras: world.transcriptExtras,
      attendanceOffExtras: world.attendanceOffExtras,
      attendanceOnExtras: world.attendanceOnExtras,
      secondBatch,
      secondSection,
      secondEnrollment,
      secondBatchLecture,
    },
    testUsers: buildTestUsers(world),
    timing: {
      secondBatchStarting: formatMysqlDate(secondBatchStarting),
    },
  }
}
