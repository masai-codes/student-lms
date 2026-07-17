import type { SeedFlowResult, TestUser } from '../../types'
import type { OnboardingWorld } from './buildOnboardingWorld'
import { buildOnboardingWorld } from './buildOnboardingWorld'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import { getOnboardingScenario } from './scenarios'
import type { OnboardingFlowId, OnboardingScenario } from './types'

function buildTestUsers(world: OnboardingWorld): TestUser[] {
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

function toSeedFlowResult(
  flowId: OnboardingFlowId,
  world: OnboardingWorld,
): SeedFlowResult {
  return {
    flowId,
    entities: {
      admin: world.admin,
      student: world.student,
      batch: world.batch,
      sections: world.sections,
      lectures: world.lectures,
      enrollments: world.enrollments,
      admission: world.admission,
      profile: world.profile,
    },
    testUsers: buildTestUsers(world),
    timing: {
      batchStarting: world.batch.starting,
      lmsAccessDate: world.admission?.lmsAccessDate ?? '',
      courseFeeDeadline: world.admission?.courseFeeDeadline ?? '',
    },
  }
}

export async function runOnboardingFlow(
  flowId: OnboardingFlowId,
  scenarioOverride?: OnboardingScenario,
): Promise<SeedFlowResult> {
  const scenario = scenarioOverride ?? getOnboardingScenario(flowId)
  const world = await buildOnboardingWorld(flowId, scenario)
  return toSeedFlowResult(flowId, world)
}
