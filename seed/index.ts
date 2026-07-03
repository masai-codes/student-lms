import './utils/loadEnv'

import { getFlow } from './registry'
import { resetDatabase } from './resetDatabase'
import type { SeedFlowResult } from './types'

export { resetDatabase } from './resetDatabase'
export { getFlow, listFlows, seedFlowIds } from './registry'
export type {
  LoginAndJoinLectureEntities,
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
  const shouldReset = options.reset ?? true

  if (shouldReset) {
    await resetDatabase()
  }

  const flow = await getFlow(flowId)
  return flow.seed()
}
