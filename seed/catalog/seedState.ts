import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SeedFlowResult, TestUser } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const SEED_STATE_PATH = join(__dirname, 'seed-state.json')

export type FlowSeedState = {
  seededAt: string
  testUsers: TestUser[]
  timing: Record<string, string>
  entityIds: {
    batchId?: number
    sectionId?: number
    lectureId?: number
  }
}

export type CatalogSeedState = Record<string, FlowSeedState>

function extractEntityIds(result: SeedFlowResult): FlowSeedState['entityIds'] {
  const { entities } = result
  return {
    batchId: entities.batch?.id,
    sectionId: entities.section?.id,
    lectureId: entities.lecture?.id,
  }
}

export function readSeedState(): CatalogSeedState {
  if (!existsSync(SEED_STATE_PATH)) return {}
  try {
    return JSON.parse(readFileSync(SEED_STATE_PATH, 'utf8')) as CatalogSeedState
  } catch {
    return {}
  }
}

export function writeSeedState(
  result: SeedFlowResult,
  options: { replaceAll?: boolean } = {},
): CatalogSeedState {
  const entry: FlowSeedState = {
    seededAt: new Date().toISOString(),
    testUsers: result.testUsers,
    timing: result.timing,
    entityIds: extractEntityIds(result),
  }

  const next: CatalogSeedState = options.replaceAll
    ? { [result.flowId]: entry }
    : { ...readSeedState(), [result.flowId]: entry }

  writeFileSync(SEED_STATE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  return next
}

export function resolveLoginUserId(
  flowState: FlowSeedState | undefined,
  primaryLoginRole: string,
): number | null {
  if (!flowState) return null
  const match =
    flowState.testUsers.find((user) => user.role === primaryLoginRole) ??
    flowState.testUsers[0]
  return match?.userId ?? null
}
