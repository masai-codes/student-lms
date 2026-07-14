import {
  createBatch,
  createEnrollment,
  createProfile,
  createUser,
  createUserBatchAdmissionData,
  createUserDeviceToken,
} from '../../factories'
import { formatMysqlDate, offsetFromNow } from '../../utils/time'
import {
  buildSimulatedOnwardStatus,
  type SimulatedOnwardOverrides,
} from '../../onward-simulation/buildSimulatedOnwardStatus'
import { writeOnwardFixture } from '../../onward-simulation/onwardFixtureStore'
import {
  ONBOARDING_KIT_TRACKING_URL,
  flowScopedBatchName,
  flowScopedEmail,
  flowScopedUsername,
} from './constants'
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

/** Layers CLI-flag env overrides (additive-only, mirrors `--with-app-download`) onto the scenario's base simulated-onward values. */
function resolveSimulatedOnwardOverrides(
  base: SimulatedOnwardOverrides,
): SimulatedOnwardOverrides {
  return {
    documentsRequired:
      base.documentsRequired || process.env.SEED_DOCS_REQUIRED === '1',
    documentsUploaded:
      base.documentsUploaded || process.env.SEED_DOCS_UPLOADED === '1',
    kitShowKit: base.kitShowKit || process.env.SEED_KIT_SHOWN === '1',
    kitDetailsFilled:
      base.kitDetailsFilled || process.env.SEED_KIT_FILLED === '1',
    kitTrackingUrl:
      process.env.SEED_KIT_TRACKING === '1'
        ? ONBOARDING_KIT_TRACKING_URL
        : (base.kitTrackingUrl ?? null),
  }
}

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
    username: flowScopedUsername(flowId, 'student'),
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

  let simulatedOnward: SimulatedOnwardOverrides | null = null
  if (scenario.simulatedOnward) {
    simulatedOnward = resolveSimulatedOnwardOverrides(scenario.simulatedOnward)
  }

  let admission: typeof userBatchAdmissionData.$inferSelect | null = null
  if (scenario.includeAdmission) {
    admission = await createUserBatchAdmissionData({
      userId: student.id,
      batchId: batch.id,
      ...scenario.admission,
      // Student Kit isn't wired to onward in the running app yet — mirror the
      // simulated kit fields into the DB columns `getStudentKitStatus.service.ts`
      // actually reads, so the step still renders correctly today.
      ...(simulatedOnward
        ? {
            studentKitExists: simulatedOnward.kitShowKit ? 1 : 0,
            studentKitDetailsFilled: simulatedOnward.kitDetailsFilled ? 1 : 0,
            studentKitTrackingUrl: simulatedOnward.kitTrackingUrl ?? null,
          }
        : {}),
    })
  }

  let profile: ProfileRow | null = null
  if (scenario.profile !== undefined || scenario.includeAdmission) {
    let legalData = scenario.profile?.legalData
    const shouldAutoSignAgreement =
      scenario.agreementSigned ||
      process.env.SEED_AGREEMENT_SIGNED === '1' ||
      scenario.videoAttendances === 'all'
    if (
      shouldAutoSignAgreement &&
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
      meta: scenario.profile?.meta,
    })
  }

  if (simulatedOnward) {
    writeOnwardFixture(
      student.username ?? flowScopedUsername(flowId, 'student'),
      buildSimulatedOnwardStatus(simulatedOnward),
    )
  }

  const forceAppDownload =
    process.env.SEED_WITH_APP_DOWNLOAD === '1' &&
    flowId === 'onboarding-fees-unpaid'

  if (scenario.deviceToken || forceAppDownload) {
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
