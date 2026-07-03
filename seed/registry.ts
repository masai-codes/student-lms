import { loginAndJoinLectureConfig } from './flows/login-and-join-lecture/config'
import type { SeedFlowMeta, SeedFlowModule } from './types'

const flowConfigs: SeedFlowMeta[] = [loginAndJoinLectureConfig]

async function loadFlowModule(id: string): Promise<SeedFlowModule> {
  switch (id) {
    case loginAndJoinLectureConfig.id: {
      const { seedLoginAndJoinLecture } = await import(
        './flows/login-and-join-lecture/seed'
      )
      return { meta: loginAndJoinLectureConfig, seed: seedLoginAndJoinLecture }
    }
    default: {
      const known = flowConfigs.map((flow) => flow.id).join(', ')
      throw new Error(`Unknown seed flow "${id}". Known flows: ${known || '(none)'}`)
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
