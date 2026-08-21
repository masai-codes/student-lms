import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import { buildProfilePageWorld } from './buildProfilePageWorld'
import { PROFILE_PAGE_FLOW_ID, profilePageConfig } from './config'

function buildTestUsers(
  world: Awaited<ReturnType<typeof buildProfilePageWorld>>,
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

export async function seedProfilePage(): Promise<SeedFlowResult> {
  const world = await buildProfilePageWorld(PROFILE_PAGE_FLOW_ID)

  return {
    flowId: profilePageConfig.id,
    entities: {
      admin: world.admin,
      student: world.student,
      batch: world.batches[0],
      batches: world.batches,
      sections: world.sections,
      enrollments: world.enrollments,
      studentCodes: world.studentCodes,
      badges: world.badges,
      badgeConfigs: world.badgeConfigs,
      awards: world.awards,
      devices: world.devices,
      pendingUndertakingSectionId: world.pendingUndertakingSectionId,
    },
    testUsers: buildTestUsers(world),
    timing: {
      badgesEarnedOn: '14 days ago',
      sessionsLastActive: 'today, yesterday, 2 days ago',
    },
  }
}
