import {
  createAssignment,
  createBatch,
  createEnrollment,
  createLecture,
  createSection,
  createUser,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import {
  DEV_PASSWORD_PLAINTEXT,
  DEFAULT_ZOOM_LINK,
} from '../../utils/constants'
import {
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import {
  sectionDropdownBatchConfig,
  SECTION_DROPDOWN_BATCH_FLOW_ID,
} from './config'

const SECTION_NAMES = [
  'Section A — Foundations',
  'Section B — Intermediate',
  'Section C — Advanced',
] as const

function buildTestUsers(
  admin: Awaited<ReturnType<typeof createUser>>,
  student: Awaited<ReturnType<typeof createUser>>,
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

export async function seedSectionDropdownBatch(): Promise<SeedFlowResult> {
  const flowId = SECTION_DROPDOWN_BATCH_FLOW_ID

  const admin = await createUser({
    name: `Instructor Priya [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: `Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  const batch = await createBatch({
    name: `Section Dropdown Batch [${flowId}]`,
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 7 })),
    meta: { showSectionDropdown: true },
  })

  const liveSchedule = offsetFromNow({ minutesAgo: 120 })
  const liveConcludes = offsetFromNow({ minutesAgo: 60 })
  const videoSchedule = offsetFromNow({ daysAgo: 1 })
  const assignmentSchedule = offsetFromNow({ daysAgo: 1 })

  const sections = []
  const enrollments = []
  const lectures = []
  const assignments = []

  for (const [index, name] of SECTION_NAMES.entries()) {
    const section = await createSection({
      batchId: batch.id,
      name: `${name} [${flowId}]`,
    })

    const enrollment = await createEnrollment({
      sectionId: section.id,
      userId: student.id,
      managerId: admin.id,
    })

    const liveLecture = await createLecture({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      title: `[${flowId}] ${name} — Live session`,
      category: 'live-session',
      module: `Module ${index + 1}`,
      type: 'live',
      description: `Live lecture seeded for ${name}.`,
      optional: 0,
      week: index + 1,
      day: 1,
      schedule: formatMysqlDatetime(liveSchedule),
      concludes: formatMysqlDatetime(liveConcludes),
      startDate: formatMysqlDate(liveSchedule),
      endDate: formatMysqlDate(liveConcludes),
      zoomLink: DEFAULT_ZOOM_LINK,
    })

    const videoLecture = await createLecture({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      title: `[${flowId}] ${name} — Recorded lecture`,
      category: 'course',
      module: `Module ${index + 1}`,
      type: 'video',
      description: `Recorded lecture seeded for ${name}.`,
      optional: 0,
      week: index + 1,
      day: 2,
      schedule: formatMysqlDatetime(videoSchedule),
      startDate: formatMysqlDate(videoSchedule),
      zoomLink: null,
    })

    const assignment = await createAssignment({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      title: `[${flowId}] ${name} — Practice assignment`,
      category: 'coding',
      type: 'assignment',
      module: `Module ${index + 1}`,
      instructions: `Practice assignment seeded for ${name}.`,
      optional: 0,
      week: index + 1,
      day: 3,
      schedule: formatMysqlDatetime(assignmentSchedule),
      startDate: formatMysqlDate(assignmentSchedule),
    })

    sections.push(section)
    enrollments.push(enrollment)
    lectures.push(liveLecture, videoLecture)
    assignments.push(assignment)
  }

  return {
    flowId: sectionDropdownBatchConfig.id,
    entities: {
      admin,
      student,
      batch,
      sections,
      enrollments,
      lectures,
      assignments,
    },
    testUsers: buildTestUsers(admin, student),
    timing: {
      liveSchedule: formatMysqlDatetime(liveSchedule),
      liveConcludes: formatMysqlDatetime(liveConcludes),
      videoSchedule: formatMysqlDatetime(videoSchedule),
      assignmentSchedule: formatMysqlDatetime(assignmentSchedule),
    },
  }
}
