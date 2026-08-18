import {
  createBadge,
  createBadgeConfig,
  createBatch,
  createBatchUser,
  createEnrollment,
  createProfile,
  createSection,
  createSession,
  createUser,
  createUserBadge,
  createUserBatchAdmissionData,
} from '../../factories'
import { formatMysqlDate, offsetFromNow } from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import {
  PROFILE_BADGES,
  PROFILE_SEED_DEVICES,
  PROFILE_UNDERTAKING_TEMPLATE,
} from './constants'
import type { ProfilePageFlowId } from './config'

import type {
  badgeConfigs,
  badges,
  sectionUser,
  sections,
  sessions,
  userBadges,
} from '@/db/schema'

export type ProfilePageWorld = {
  flowId: ProfilePageFlowId
  admin: Awaited<ReturnType<typeof createUser>>
  student: Awaited<ReturnType<typeof createUser>>
  batches: Array<Awaited<ReturnType<typeof createBatch>>>
  sections: Array<typeof sections.$inferSelect>
  enrollments: Array<typeof sectionUser.$inferSelect>
  studentCodes: Array<string>
  badges: Array<typeof badges.$inferSelect>
  badgeConfigs: Array<typeof badgeConfigs.$inferSelect>
  awards: Array<typeof userBadges.$inferSelect>
  devices: Array<typeof sessions.$inferSelect>
  pendingUndertakingSectionId: number
}

/**
 * One student, two batches, so the profile exercises the multi-code header and
 * the two-level (program → module) achievements grouping.
 *
 * Batch A additionally carries the pending acknowledgement; the student's
 * admission row has `full_fees_paid` set so the Student Kit and My Invoices tabs
 * both appear. Those two tabs proxy the external Admissions API, so their
 * contents depend on that service — the seed only unlocks the tabs.
 */
export async function buildProfilePageWorld(
  flowId: ProfilePageFlowId,
): Promise<ProfilePageWorld> {
  const admin = await createUser({
    name: 'Profile Admin',
    email: flowScopedEmail(flowId, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: 'Riya Sharma',
    email: flowScopedEmail(flowId, 'student'),
    role: 'student',
  })

  // No `meta.profile_pic`: the header should fall back to initials, and the
  // avatar upload affordance is the thing under test.
  await createProfile({ userId: student.id, secondaryMobile: '9876543210' })

  const programs = [
    { name: `SDE Batch 42 [${flowId}]`, courseTitle: 'Full Stack Development' },
    { name: `DS Batch 7 [${flowId}]`, courseTitle: 'Data Science' },
  ]

  const world: Pick<
    ProfilePageWorld,
    | 'batches'
    | 'sections'
    | 'enrollments'
    | 'studentCodes'
    | 'badges'
    | 'badgeConfigs'
    | 'awards'
  > = {
    batches: [],
    sections: [],
    enrollments: [],
    studentCodes: [],
    badges: [],
    badgeConfigs: [],
    awards: [],
  }

  let pendingUndertakingSectionId = 0

  for (const [programIndex, program] of programs.entries()) {
    const isFirstProgram = programIndex === 0

    const batch = await createBatch({
      name: program.name,
      program: isFirstProgram ? 'FT' : 'DS',
      meta: { course_title: program.courseTitle },
    })
    world.batches.push(batch)

    // Student codes live on batch_user — the source of truth the header reads.
    const studentCode = `${flowId.toUpperCase().replace(/-/g, '_')}_${programIndex + 1}`
    await createBatchUser({
      userId: student.id,
      batchId: batch.id,
      username: studentCode,
      role: 'student',
      // Healthy enrolment: this flow is not testing cancellation.
      meta: null,
    })
    world.studentCodes.push(studentCode)

    // Two modules per program, so the module pills/dropdown have something to switch.
    for (const moduleName of ['foundations', 'advanced']) {
      const isUndertakingSection = isFirstProgram && moduleName === 'foundations'

      const section = await createSection({
        batchId: batch.id,
        name: `${program.courseTitle} — ${moduleName}`,
        module: moduleName,
        settings: isUndertakingSection
          ? { undertaking_template: PROFILE_UNDERTAKING_TEMPLATE }
          : null,
      })
      world.sections.push(section)

      if (isUndertakingSection) pendingUndertakingSectionId = section.id

      world.enrollments.push(
        await createEnrollment({ userId: student.id, sectionId: section.id }),
      )

      // Each module gets both an earned and a locked badge so the grid shows
      // the earned-first ordering and the lock treatment side by side.
      for (const spec of PROFILE_BADGES) {
        const badge = await createBadge({
          title: `${spec.title} (${moduleName})`,
          description: spec.description,
          lockedBadgeDescription: spec.lockedDescription,
          linkedinShareText: spec.linkedinShareText,
          theme: spec.theme,
        })
        world.badges.push(badge)

        const config = await createBadgeConfig({
          badgeId: badge.id,
          batchId: batch.id,
          sectionId: section.id,
        })
        world.badgeConfigs.push(config)

        if (!spec.isEarned) continue

        world.awards.push(
          await createUserBadge({
            userId: student.id,
            badgeId: badge.id,
            badgeConfigId: config.id,
            releaseDate: formatMysqlDate(offsetFromNow({ daysAgo: 14 })),
          }),
        )
      }
    }
  }

  // full_fees_paid + an admission row ⇒ Student Kit and My Invoices tabs appear.
  await createUserBatchAdmissionData({
    userId: student.id,
    batchId: world.batches[0].id,
    fullFeesPaid: 1,
  })

  const devices: Array<typeof sessions.$inferSelect> = []
  for (const [index, device] of PROFILE_SEED_DEVICES.entries()) {
    devices.push(
      await createSession({
        id: `${flowId}-session-${index + 1}`,
        userId: student.id,
        userAgent: device.userAgent,
        lastActivity:
          Math.floor(offsetFromNow({ daysAgo: index }).getTime() / 1000),
      }),
    )
  }

  return {
    flowId,
    admin,
    student,
    ...world,
    devices,
    pendingUndertakingSectionId,
  }
}
