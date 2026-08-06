import {
  createBatch,
  createBatchUser,
  createDiscussion,
  createEnrollment,
  createLecture,
  createSection,
  createUser,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import {
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import {
  discussionsCancelledEnrollmentConfig,
  DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
} from './config'

function buildTestUsers(
  admin: Awaited<ReturnType<typeof createUser>>,
  cancelledStudent: Awaited<ReturnType<typeof createUser>>,
  authorStudent: Awaited<ReturnType<typeof createUser>>,
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
      email: cancelledStudent.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: cancelledStudent.id,
      name: cancelledStudent.name,
    },
    {
      role: 'student',
      email: authorStudent.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: authorStudent.id,
      name: authorStudent.name,
    },
  ]
}

/**
 * A student whose batch-level enrolment has been cancelled
 * (`batch_user.meta.batchEnrolmentCancelled = true`) while their
 * `section_user` row stays active — the "still nominally in the section but
 * administratively cancelled at the batch level" scenario. A second, healthy
 * student authors a public discussion on a lecture in the same batch, so
 * there's something real to prove is hidden from the cancelled student via
 * `listLearnDiscussionsForBatch` → `getBatchIdsForEnrolledUser`.
 */
export async function seedDiscussionsCancelledEnrollment(): Promise<SeedFlowResult> {
  const flowId = DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID

  const admin = await createUser({
    name: `Instructor [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const cancelledStudent = await createUser({
    name: `Cancelled Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  const authorStudent = await createUser({
    name: `Author Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'author'),
    role: 'student',
  })

  const batch = await createBatch({
    name: `Discussions Cancelled Enrollment Batch [${flowId}]`,
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 14 })),
  })

  const section = await createSection({
    batchId: batch.id,
    name: `Discussions Cancelled Enrollment Section [${flowId}]`,
  })

  const cancelledEnrollment = await createEnrollment({
    sectionId: section.id,
    userId: cancelledStudent.id,
    managerId: admin.id,
  })

  const authorEnrollment = await createEnrollment({
    sectionId: section.id,
    userId: authorStudent.id,
    managerId: admin.id,
  })

  const lectureSchedule = offsetFromNow({ daysAgo: 1 })

  const lecture = await createLecture({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Intro to Batch Restrictions`,
    category: 'course',
    module: 'Restrictions',
    type: 'video',
    description:
      'Lecture used to host a public discussion that should be hidden from a batch-cancelled student.',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(lectureSchedule),
    startDate: formatMysqlDate(lectureSchedule),
    zoomLink: null,
  })

  const discussion = await createDiscussion({
    entityType: 'App\\Models\\Lecture',
    entityId: lecture.id,
    userId: authorStudent.id,
    title: `[${flowId}] Anyone else stuck on this?`,
    message:
      'Public discussion authored by the healthy student — should be hidden from the batch-cancelled student.',
    public: 1,
  })

  // Batch-level cancellation for the cancelled student only. Their
  // `section_user` row above stays active/undeleted.
  const cancelledBatchUser = await createBatchUser({
    userId: cancelledStudent.id,
    batchId: batch.id,
  })

  return {
    flowId: discussionsCancelledEnrollmentConfig.id,
    entities: {
      admin,
      student: cancelledStudent,
      authorStudent,
      batch,
      section,
      cancelledEnrollment,
      authorEnrollment,
      lecture,
      discussion,
      cancelledBatchUser,
    },
    testUsers: buildTestUsers(admin, cancelledStudent, authorStudent),
    timing: {
      lectureSchedule: formatMysqlDatetime(lectureSchedule),
    },
  }
}
