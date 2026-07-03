import {
  createBatch,
  createEnrollment,
  createProfile,
  createUser,
  createUserBatchAdmissionData,
  createUserDeviceToken,
} from '../../factories'
import { formatMysqlDate, offsetFromNow } from '../../utils/time'
import { flowScopedBatchName, flowScopedEmail } from './constants'
import { seedOnboardingSectionsAndLectures } from './seedOnboardingSections'
import { seedOnboardingVideoAttendances } from './seedOnboardingVideoAttendances'
import type { OnboardingSectionKey } from '../../types'
import type { OnboardingFlowId, OnboardingScenario } from './types'

import type {
  lectures,
  profiles,
  sectionUser,
  sections,
  userBatchAdmissionData,
  users,
} from '@/db/schema'

type BatchRow = typeof import('@/db/schema').batches.$inferSelect
type ProfileRow = typeof profiles.$inferSelect
type LectureSelect = typeof lectures.$inferSelect

export type OnboardingWorld = {
  flowId: OnboardingFlowId
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: BatchRow
  sections: Record<OnboardingSectionKey, typeof sections.$inferSelect>
  lectures: Record<OnboardingSectionKey, Array<LectureSelect>>
  enrollments: Array<typeof sectionUser.$inferSelect>
  admission: typeof userBatchAdmissionData.$inferSelect | null
  profile: ProfileRow | null
}

export async function buildOnboardingWorld(
  flowId: OnboardingFlowId,
  scenario: OnboardingScenario,
): Promise<OnboardingWorld> {
  const admin = await createUser({
    name: `Admin [${flowId}]`,
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: `Student [${flowId}]`,
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
    meta: scenario.userMeta ?? {},
  })

  const batch = await createBatch({
    name: flowScopedBatchName(flowId),
    program: 'SDE',
    duration: '30 weeks',
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 0 })),
  })

  const { sections, lectures } = await seedOnboardingSectionsAndLectures(
    flowId,
    batch.id,
    admin.id,
  )

  const enrollments: Array<typeof sectionUser.$inferSelect> = []
  for (const section of Object.values(sections)) {
    enrollments.push(
      await createEnrollment({
        sectionId: section.id,
        userId: student.id,
        managerId: admin.id,
      }),
    )
  }

  let admission: typeof userBatchAdmissionData.$inferSelect | null = null
  if (scenario.includeAdmission) {
    admission = await createUserBatchAdmissionData({
      userId: student.id,
      batchId: batch.id,
      ...scenario.admission,
    })
  }

  let profile: ProfileRow | null = null
  if (scenario.profile !== undefined || scenario.includeAdmission) {
    let legalData = scenario.profile?.legalData
    if (
      scenario.videoAttendances === 'all' &&
      legalData === undefined &&
      sections.programOnboardingWeb
    ) {
      legalData = {
        agreements: {
          [`section_${sections.programOnboardingWeb.id}`]: {
            haveAcceptedLegalAgreement: true,
          },
        },
      }
    }

    profile = await createProfile({
      userId: student.id,
      legalData: legalData ?? scenario.profile?.legalData,
    })
  }

  if (scenario.deviceToken) {
    await createUserDeviceToken({
      userId: student.id,
      token: `seed-device-${flowId}`,
      deviceType: 'ios',
    })
  }

  const world: OnboardingWorld = {
    flowId,
    admin,
    student,
    batch,
    sections,
    lectures,
    enrollments,
    admission,
    profile,
  }

  await seedOnboardingVideoAttendances(world, scenario.videoAttendances)
  return world
}
