import {
  createAnnouncement,
  createAnnouncementRead,
  createAssignment,
  createBatch,
  createEnrollment,
  createLecture,
  createMessage,
  createSection,
  createSubmission,
  createUser,
  createWhatsnew,
} from '../../factories'
import { DEFAULT_ZOOM_LINK } from '../../utils/constants'
import {
  addDays,
  addMinutes,
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
} from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import type { DashboardHomeFlowId } from './config'

import type {
  announcements,
  assignments,
  lectures,
  messages,
  sectionUser,
  sections,
  whatsnew,
} from '@/db/schema'

type LectureRow = typeof lectures.$inferSelect
type AssignmentRow = typeof assignments.$inferSelect
type AnnouncementRow = typeof announcements.$inferSelect
type MessageRow = typeof messages.$inferSelect
type WhatsnewRow = typeof whatsnew.$inferSelect

export type DashboardHomeWorld = {
  flowId: DashboardHomeFlowId
  admin: Awaited<ReturnType<typeof createUser>>
  student: Awaited<ReturnType<typeof createUser>>
  batch: Awaited<ReturnType<typeof createBatch>>
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  scheduleLectures: Array<LectureRow>
  scheduleAssignment: AssignmentRow
  pastIncompleteScheduleAssignment: AssignmentRow
  pendingCatchupLecture: LectureRow
  pendingAssignment: AssignmentRow
  visibleAnnouncements: Array<AnnouncementRow>
  visibleMessages: Array<MessageRow>
  productUpdates: Array<WhatsnewRow>
  exclusions: {
    readAnnouncementId: number
    expiredAnnouncementId: number
    futureAnnouncementId: number
    startedAssignmentId: number
    overdueAssignmentId: number
    optionalCatchupLectureId: number
  }
}

const CATCHUP_SECTION_SETTINGS = {
  enableVideoAttendance: true,
  catchUpDays: 7,
} as const

export async function buildDashboardHomeWorld(
  flowId: DashboardHomeFlowId,
): Promise<DashboardHomeWorld> {
  const admin = await createUser({
    name: `Admin [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: `Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  const batch = await createBatch({
    name: `Dashboard Home Batch [${flowId}]`,
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 14 })),
  })

  const section = await createSection({
    batchId: batch.id,
    name: `Dashboard Section [${flowId}]`,
    settings: CATCHUP_SECTION_SETTINGS,
  })

  const enrollment = await createEnrollment({
    sectionId: section.id,
    userId: student.id,
    managerId: admin.id,
  })

  const today = offsetFromNow({ daysAgo: 0 })
  const yesterday = offsetFromNow({ daysAgo: 1 })
  const day2 = addDays(today, 2)
  const day4 = addDays(today, 4)

  const scheduleTodayStart = addMinutes(today, 120)
  const scheduleTodayEnd = addMinutes(scheduleTodayStart, 90)
  const scheduleDay2Start = addMinutes(day2, 180)
  const scheduleDay2End = addMinutes(scheduleDay2Start, 60)

  const scheduleLectures = [
    await createLecture({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      title: `[${flowId}] Live lecture today`,
      type: 'live',
      schedule: formatMysqlDatetime(scheduleTodayStart),
      concludes: formatMysqlDatetime(scheduleTodayEnd),
      startDate: formatMysqlDate(today),
      endDate: formatMysqlDate(today),
      zoomLink: DEFAULT_ZOOM_LINK,
    }),
    await createLecture({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      title: `[${flowId}] Lecture on day 3`,
      type: 'live',
      schedule: formatMysqlDatetime(scheduleDay2Start),
      concludes: formatMysqlDatetime(scheduleDay2End),
      startDate: formatMysqlDate(day2),
      endDate: formatMysqlDate(day2),
      zoomLink: DEFAULT_ZOOM_LINK,
    }),
  ]

  const scheduleAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Assignment in schedule window`,
    schedule: formatMysqlDatetime(addMinutes(day4, 60)),
    concludes: formatMysqlDatetime(addDays(day4, 2)),
    startDate: formatMysqlDate(day4),
    endDate: formatMysqlDate(day4),
  })

  const pastIncompleteScheduleAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Past incomplete assignment (schedule)`,
    schedule: formatMysqlDatetime(yesterday),
    concludes: formatMysqlDatetime(addDays(today, 3)),
    startDate: formatMysqlDate(yesterday),
    endDate: formatMysqlDate(addDays(today, 3)),
  })

  const catchupStart = offsetFromNow({ daysAgo: 1, minutesAgo: 120 })
  const catchupEnd = offsetFromNow({ daysAgo: 1 })
  const pendingCatchupLecture = await createLecture({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Catch-up lecture (pending)`,
    type: 'live',
    schedule: formatMysqlDatetime(catchupStart),
    concludes: formatMysqlDatetime(catchupEnd),
    startDate: formatMysqlDate(catchupStart),
    endDate: formatMysqlDate(catchupEnd),
    zoomLink: DEFAULT_ZOOM_LINK,
  })

  const pendingAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Pending assignment (not begun)`,
    schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 60 })),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -3 })),
    startDate: formatMysqlDate(offsetFromNow({ daysAgo: 1 })),
    endDate: formatMysqlDate(offsetFromNow({ daysAgo: -3 })),
  })

  const startedAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Started assignment (hidden from pending)`,
    schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 30 })),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -2 })),
    startDate: formatMysqlDate(today),
    endDate: formatMysqlDate(addDays(today, 2)),
  })
  await createSubmission({
    assignmentId: startedAssignment.id,
    userId: student.id,
    started: 1,
  })

  const overdueAssignment = await createAssignment({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Overdue assignment (hidden from pending)`,
    schedule: formatMysqlDatetime(offsetFromNow({ daysAgo: 5 })),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: 1 })),
    startDate: formatMysqlDate(offsetFromNow({ daysAgo: 5 })),
    endDate: formatMysqlDate(offsetFromNow({ daysAgo: 1 })),
  })

  const optionalCatchupLecture = await createLecture({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    title: `[${flowId}] Optional catch-up (hidden from pending)`,
    type: 'live',
    optional: 1,
    schedule: formatMysqlDatetime(catchupStart),
    concludes: formatMysqlDatetime(catchupEnd),
    startDate: formatMysqlDate(catchupStart),
    endDate: formatMysqlDate(catchupEnd),
  })

  const visibleAnnouncements = [
    await createAnnouncement({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      subject: `[${flowId}] Section announcement (newest)`,
      schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 5 })),
      concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -14 })),
    }),
    await createAnnouncement({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      subject: `[${flowId}] Section announcement (older)`,
      schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 45 })),
      concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -14 })),
    }),
    await createAnnouncement({
      batchId: batch.id,
      sectionId: section.id,
      userId: admin.id,
      subject: `[${flowId}] Section announcement (oldest visible)`,
      schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 90 })),
      concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -14 })),
    }),
  ]

  const readAnnouncement = await createAnnouncement({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    subject: `[${flowId}] Already read (hidden)`,
    schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 10 })),
  })
  await createAnnouncementRead({
    announcementId: readAnnouncement.id,
    userId: student.id,
    isUnread: 0,
  })

  const expiredAnnouncement = await createAnnouncement({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    subject: `[${flowId}] Expired (hidden)`,
    schedule: formatMysqlDatetime(offsetFromNow({ daysAgo: 10 })),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: 2 })),
  })

  const futureAnnouncement = await createAnnouncement({
    batchId: batch.id,
    sectionId: section.id,
    userId: admin.id,
    subject: `[${flowId}] Future (hidden)`,
    schedule: formatMysqlDatetime(offsetFromNow({ daysAgo: -2 })),
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -14 })),
  })

  const visibleMessages = [
    await createMessage({
      userId: student.id,
      authorId: admin.id,
      subject: `[${flowId}] For You (newer)`,
      meta: { title: `[${flowId}] For You message (newer)` },
      schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 20 })),
      concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -7 })),
    }),
    await createMessage({
      userId: student.id,
      authorId: admin.id,
      subject: `[${flowId}] For You (older)`,
      meta: { title: `[${flowId}] For You message (older)` },
      schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 55 })),
      concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -7 })),
    }),
  ]

  const productUpdates: Array<WhatsnewRow> = []
  for (let index = 0; index < 7; index++) {
    productUpdates.push(
      await createWhatsnew({
        subject: `[${flowId}] Product update #${index + 1}`,
        body: `Release notes item ${index + 1} for dashboard cap testing.`,
      }),
    )
  }

  return {
    flowId,
    admin,
    student,
    batch,
    section,
    enrollment,
    scheduleLectures,
    scheduleAssignment,
    pastIncompleteScheduleAssignment,
    pendingCatchupLecture,
    pendingAssignment,
    visibleAnnouncements,
    visibleMessages,
    productUpdates,
    exclusions: {
      readAnnouncementId: readAnnouncement.id,
      expiredAnnouncementId: expiredAnnouncement.id,
      futureAnnouncementId: futureAnnouncement.id,
      startedAssignmentId: startedAssignment.id,
      overdueAssignmentId: overdueAssignment.id,
      optionalCatchupLectureId: optionalCatchupLecture.id,
    },
  }
}
