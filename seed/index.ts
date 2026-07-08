import './utils/loadEnv'

import { getFlow } from './registry'
import { resetDatabase } from './resetDatabase'
import { assertLocalSeedDatabase } from './utils/assertLocalSeedDatabase'
import type { SeedFlowResult } from './types'

export { resetDatabase } from './resetDatabase'
export { getFlow, listFlows, seedFlowIds } from './registry'
export type {
  LoginAndJoinLectureEntities,
  OnboardingEntities,
  OnboardingSectionKey,
  SeedFlowEntities,
  SeedFlowMeta,
  SeedFlowModule,
  SeedFlowResult,
  TestUser,
} from './types'

export type SeedFlowOptions = {
  reset?: boolean
}

/**
 * Runs a registered seed flow programmatically (CLI and integration tests).
 * When `reset` is true (default), truncates app-data tables first.
 */
export async function seedFlow(
  flowId: string,
  options: SeedFlowOptions = {},
): Promise<SeedFlowResult> {
  assertLocalSeedDatabase()

  const shouldReset = options.reset ?? true

  if (shouldReset) {
    await resetDatabase()
  }

  const flow = await getFlow(flowId)
  return flow.seed()
}

/**
 * Runs every registered seed flow in registry order.
 * Resets the database once before the first flow unless `reset` is false.
 */
export async function seedAllFlows(
  options: SeedFlowOptions = {},
): Promise<SeedFlowResult[]> {
  const shouldReset = options.reset ?? true
  const { seedFlowIds } = await import('./registry')

  const results: SeedFlowResult[] = []
  for (let index = 0; index < seedFlowIds.length; index++) {
    const result = await seedFlow(seedFlowIds[index], {
      reset: shouldReset && index === 0,
    })
    results.push(result)
  }

  return results
}
