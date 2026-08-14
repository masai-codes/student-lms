import {
  createBatch,
  createBatchUser,
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
const PAUSED_PROGRAM_NAME = 'Product Design'
/** IST wall-clock cutoff written to `batch_user.meta.batchPausedDate`. */
const PAUSED_DAYS_AGO = 7

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
 *
 * A third batch (Product Design) is seeded with the enrolment PAUSED
 * (`batch_user.meta.batchPaused`) and a lecture on each side of the pause
 * cutoff, so /my-courses has a "Paused Programs" section to render.
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

  // Third batch: same student, enrolment PAUSED. Their `section_user` row stays
  // active (a pause is not a cancellation), so the batch still resolves through
  // `getBatchIdsForEnrolledUser` — /my-courses is what splits it into the
  // "Paused Programs" section, and /learn hides only post-cutoff content.
  const pausedBatchStarting = offsetFromNow({ daysAgo: 60 })

  const pausedBatch = await createBatch({
    name: `Product Design Batch [${MULTI_PROGRAM_STUDENT_FLOW_ID}]`,
    program: PAUSED_PROGRAM_NAME,
    duration: '20 weeks',
    starting: formatMysqlDate(pausedBatchStarting),
    settings: { showBatchDetails: true },
  })

  const pausedSection = await createSection({
    batchId: pausedBatch.id,
    name: `Product Design Section [${MULTI_PROGRAM_STUDENT_FLOW_ID}]`,
  })

  const pausedEnrollment = await createEnrollment({
    sectionId: pausedSection.id,
    userId: world.student.id,
    managerId: world.admin.id,
  })

  const pausedCutoff = offsetFromNow({ daysAgo: PAUSED_DAYS_AGO })

  const pausedBatchUser = await createBatchUser({
    userId: world.student.id,
    batchId: pausedBatch.id,
    meta: JSON.stringify({
      batchPaused: true,
      batchPausedDate: formatMysqlDate(pausedCutoff),
    }),
  })

  // One lecture on each side of the pause cutoff, so the pause has a visible
  // effect on /learn as well as on the /my-courses listing.
  const preePauseLectureSchedule = offsetFromNow({ daysAgo: PAUSED_DAYS_AGO + 7 })

  const prePauseLecture = await createLecture({
    batchId: pausedBatch.id,
    sectionId: pausedSection.id,
    userId: world.admin.id,
    title: `[${MULTI_PROGRAM_STUDENT_FLOW_ID}] Product Design — Before the pause`,
    category: 'course',
    module: 'Design Foundations',
    type: 'video',
    description: 'Scheduled before the pause cutoff — stays visible to the student.',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(preePauseLectureSchedule),
    startDate: formatMysqlDate(preePauseLectureSchedule),
    zoomLink: null,
  })

  const postPauseLectureSchedule = offsetFromNow({ daysAgo: 1 })

  const postPauseLecture = await createLecture({
    batchId: pausedBatch.id,
    sectionId: pausedSection.id,
    userId: world.admin.id,
    title: `[${MULTI_PROGRAM_STUDENT_FLOW_ID}] Product Design — After the pause`,
    category: 'course',
    module: 'Design Foundations',
    type: 'video',
    description: 'Scheduled after the pause cutoff — hidden while the pause stands.',
    optional: 0,
    week: 3,
    day: 1,
    schedule: formatMysqlDatetime(postPauseLectureSchedule),
    startDate: formatMysqlDate(postPauseLectureSchedule),
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
      operatorsExtras: world.operatorsExtras,
      attendanceOffExtras: world.attendanceOffExtras,
      attendanceOnExtras: world.attendanceOnExtras,
      secondBatch,
      secondSection,
      secondEnrollment,
      secondBatchLecture,
      pausedBatch,
      pausedSection,
      pausedEnrollment,
      pausedBatchUser,
      prePauseLecture,
      postPauseLecture,
    },
    testUsers: buildTestUsers(world),
    timing: {
      secondBatchStarting: formatMysqlDate(secondBatchStarting),
      pausedBatchStarting: formatMysqlDate(pausedBatchStarting),
      batchPausedDate: formatMysqlDate(pausedCutoff),
    },
  }
}
