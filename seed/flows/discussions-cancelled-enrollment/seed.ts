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
  multiBatchStudent: Awaited<ReturnType<typeof createUser>>,
  authorStudent: Awaited<ReturnType<typeof createUser>>,
  authorStudent2: Awaited<ReturnType<typeof createUser>>,
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
      email: multiBatchStudent.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: multiBatchStudent.id,
      name: multiBatchStudent.name,
    },
    {
      role: 'author',
      email: authorStudent.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: authorStudent.id,
      name: authorStudent.name,
    },
    {
      role: 'author2',
      email: authorStudent2.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: authorStudent2.id,
      name: authorStudent2.name,
    },
  ]
}

/**
 * A student enrolled in two batches at once:
 * - Batch A: batch-level enrolment cancelled
 *   (`batch_user.meta.batchEnrolmentCancelled = true`) while their
 *   `section_user` row stays active — the "still nominally in the section
 *   but administratively cancelled at the batch level" scenario.
 * - Batch B: healthy/active, no `batch_user` restriction row at all.
 *
 * Each batch has its own section and a lecture hosting a public discussion
 * from *multiple* people — a batch-local healthy student plus the
 * multi-batch student themself — so there's something real to prove is
 * hidden (batch A) vs. still fully visible (batch B) via
 * `listLearnDiscussionsForBatch` → `getBatchIdsForEnrolledUser`.
 */
export async function seedDiscussionsCancelledEnrollment(): Promise<SeedFlowResult> {
  const flowId = DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID

  const admin = await createUser({
    name: `Instructor [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  // Enrolled in both batches below: cancelled in batch A, healthy in batch B.
  const multiBatchStudent = await createUser({
    name: `Multi-Batch Student — Cancelled in Batch A [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  // Healthy, batch-A-only — discussion author on the cancelled batch.
  const authorStudent = await createUser({
    name: `Author Student — Batch A [${flowId}]`,
    email: flowScopedEmail(flowId, 'author'),
    role: 'student',
  })

  // Healthy, batch-B-only — discussion author on the healthy batch.
  const authorStudent2 = await createUser({
    name: `Author Student — Batch B [${flowId}]`,
    email: flowScopedEmail(flowId, 'author2'),
    role: 'student',
  })

  const batch = await createBatch({
    name: `Discussions Cancelled Enrollment Batch A [${flowId}]`,
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 14 })),
  })

  const section = await createSection({
    batchId: batch.id,
    name: `Discussions Cancelled Enrollment Section A [${flowId}]`,
  })

  const secondBatch = await createBatch({
    name: `Discussions Cancelled Enrollment Batch B [${flowId}]`,
    program: 'Data Science',
    duration: '24 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 7 })),
  })

  const secondSection = await createSection({
    batchId: secondBatch.id,
    name: `Discussions Cancelled Enrollment Section B [${flowId}]`,
  })

  const cancelledEnrollment = await createEnrollment({
    sectionId: section.id,
    userId: multiBatchStudent.id,
    managerId: admin.id,
  })

  const authorEnrollment = await createEnrollment({
    sectionId: section.id,
    userId: authorStudent.id,
    managerId: admin.id,
  })

  // `multiBatchStudent`'s healthy enrolment into batch B — no restrictions.
  const secondEnrollment = await createEnrollment({
    sectionId: secondSection.id,
    userId: multiBatchStudent.id,
    managerId: admin.id,
  })

  const secondAuthorEnrollment = await createEnrollment({
    sectionId: secondSection.id,
    userId: authorStudent2.id,
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
      'Lecture used to host public discussions that should be hidden from a batch-cancelled student.',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(lectureSchedule),
    startDate: formatMysqlDate(lectureSchedule),
    zoomLink: null,
  })

  const secondLectureSchedule = offsetFromNow({ daysAgo: 1 })

  const secondLecture = await createLecture({
    batchId: secondBatch.id,
    sectionId: secondSection.id,
    userId: admin.id,
    title: `[${flowId}] Data Science — Intro to Pandas`,
    category: 'course',
    module: 'Data Analysis',
    type: 'video',
    description:
      'Lecture used to host public discussions on the healthy batch — should remain fully visible.',
    optional: 0,
    week: 1,
    day: 1,
    schedule: formatMysqlDatetime(secondLectureSchedule),
    startDate: formatMysqlDate(secondLectureSchedule),
    zoomLink: null,
  })

  // Batch A discussions — from multiple people: the batch-A-only author, and
  // the multi-batch student themself (posted while their `section_user` row
  // is still active).
  const discussion = await createDiscussion({
    entityType: 'App\\Models\\Lecture',
    entityId: lecture.id,
    userId: authorStudent.id,
    title: `[${flowId}] Anyone else stuck on this?`,
    message:
      'Public discussion authored by the batch-A-only healthy student — should be hidden from the batch-cancelled student.',
    public: 1,
  })

  const discussionByStudentOnBatch = await createDiscussion({
    entityType: 'App\\Models\\Lecture',
    entityId: lecture.id,
    userId: multiBatchStudent.id,
    title: `[${flowId}] Posted before my enrolment was cancelled`,
    message:
      'Public discussion authored by the multi-batch student on batch A, before their batch-level enrolment was cancelled — still hidden from them afterward via listLearnDiscussionsForBatch.',
    public: 1,
  })

  // Batch B discussions — from multiple people: the batch-B-only author, and
  // the multi-batch student themself (healthy here, so this stays visible).
  const secondDiscussion = await createDiscussion({
    entityType: 'App\\Models\\Lecture',
    entityId: secondLecture.id,
    userId: authorStudent2.id,
    title: `[${flowId}] Pandas groupby question`,
    message:
      'Public discussion authored by the batch-B-only healthy student — visible to everyone enrolled in batch B.',
    public: 1,
  })

  const discussionByStudentOnSecondBatch = await createDiscussion({
    entityType: 'App\\Models\\Lecture',
    entityId: secondLecture.id,
    userId: multiBatchStudent.id,
    title: `[${flowId}] Great lecture, thanks!`,
    message:
      "Public discussion authored by the multi-batch student on batch B, where they're healthy — remains visible.",
    public: 1,
  })

  // Batch-level cancellation for the multi-batch student, batch A only.
  // Their `section_user` row above (batch A) stays active/undeleted, and
  // there is no `batch_user` row at all for batch B — leaving it healthy.
  const cancelledBatchUser = await createBatchUser({
    userId: multiBatchStudent.id,
    batchId: batch.id,
  })

  return {
    flowId: discussionsCancelledEnrollmentConfig.id,
    entities: {
      admin,
      student: multiBatchStudent,
      authorStudent,
      authorStudent2,
      batch,
      section,
      secondBatch,
      secondSection,
      cancelledEnrollment,
      authorEnrollment,
      secondEnrollment,
      secondAuthorEnrollment,
      lecture,
      secondLecture,
      discussion,
      discussionByStudentOnBatch,
      secondDiscussion,
      discussionByStudentOnSecondBatch,
      cancelledBatchUser,
    },
    testUsers: buildTestUsers(
      admin,
      multiBatchStudent,
      authorStudent,
      authorStudent2,
    ),
    timing: {
      lectureSchedule: formatMysqlDatetime(lectureSchedule),
      secondLectureSchedule: formatMysqlDatetime(secondLectureSchedule),
    },
  }
}
