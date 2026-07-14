import { loginAndJoinLectureConfig } from './flows/login-and-join-lecture/config'
import { liveLecturePhasesConfig } from './flows/live-lecture-phases/config'
import { dashboardHomeConfig } from './flows/dashboard-home/config'
import {
  createOnboardingFlowMeta,
  ONBOARDING_FLOW_IDS,
} from './flows/onboarding-shared/flowMeta'
import type { OnboardingFlowId } from './flows/onboarding-shared/types'
import type { SeedFlowMeta, SeedFlowModule } from './types'

const onboardingConfigs = ONBOARDING_FLOW_IDS.map((id) =>
  createOnboardingFlowMeta(id),
)

const flowConfigs: SeedFlowMeta[] = [
  loginAndJoinLectureConfig,
  liveLecturePhasesConfig,
  dashboardHomeConfig,
  ...onboardingConfigs,
]

function isOnboardingFlowId(id: string): id is OnboardingFlowId {
  return (ONBOARDING_FLOW_IDS as Array<string>).includes(id)
}

async function loadFlowModule(id: string): Promise<SeedFlowModule> {
  if (isOnboardingFlowId(id)) {
    const { runOnboardingFlow } =
      await import('./flows/onboarding-shared/runOnboardingFlow')
    return {
      meta: createOnboardingFlowMeta(id),
      seed: () => runOnboardingFlow(id),
    }
  }

  switch (id) {
    case loginAndJoinLectureConfig.id: {
      const { seedLoginAndJoinLecture } =
        await import('./flows/login-and-join-lecture/seed')
      return { meta: loginAndJoinLectureConfig, seed: seedLoginAndJoinLecture }
    }
    case liveLecturePhasesConfig.id: {
      const { seedLiveLecturePhases } = await import('./flows/live-lecture-phases/seed')
      return { meta: liveLecturePhasesConfig, seed: seedLiveLecturePhases }
    }
    case dashboardHomeConfig.id: {
      const { seedDashboardHome } = await import('./flows/dashboard-home/seed')
      return { meta: dashboardHomeConfig, seed: seedDashboardHome }
    }
    default: {
      const known = flowConfigs.map((flow) => flow.id).join(', ')
      throw new Error(
        `Unknown seed flow "${id}". Known flows: ${known || '(none)'}`,
      )
    }
  }
}

export function listFlows(): SeedFlowMeta[] {
  return flowConfigs
}

export async function getFlow(id: string): Promise<SeedFlowModule> {
  return loadFlowModule(id)
}

/** Eager map for consumers that import flow modules directly. */
export const seedFlowIds = flowConfigs.map((flow) => flow.id)
