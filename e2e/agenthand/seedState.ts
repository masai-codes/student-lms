import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Typed reader for `seed/catalog/seed-state.json` — the source of truth the
 * seed runner writes after `npm run seed:all`. Tests read student emails and
 * entity ids from here instead of hardcoding, so they survive a reseed.
 */

export type SeedTestUser = {
  role: string
  email: string
  password: string
  userId: number
  name: string
}

export type SeedEntityIds = {
  batchId?: number
  sectionId?: number
  lectureId?: number
  beforeUnlockLectureId?: number
  duringJoinLectureId?: number
  afterNoRecordingLectureId?: number
  afterWithRecordingAttendanceOffLectureId?: number
  afterWithRecordingAttendanceOnLectureId?: number
  videoMandatoryLectureId?: number
  videoOptionalLectureId?: number
  optionalLiveBeforeUnlockLectureId?: number
  optionalLiveDuringJoinLectureId?: number
  recordingAttendanceOffSectionId?: number
  recordingAttendanceOnSectionId?: number
}

export type FlowSeedState = {
  seededAt: string
  testUsers: SeedTestUser[]
  timing: Record<string, string>
  entityIds: SeedEntityIds
}

export type CatalogSeedState = Record<string, FlowSeedState>

const SEED_STATE_PATH = resolve(process.cwd(), 'seed/catalog/seed-state.json')

let cache: CatalogSeedState | null = null

export function readSeedState(): CatalogSeedState {
  if (cache) return cache
  if (!existsSync(SEED_STATE_PATH)) {
    throw new Error(
      `seed-state.json not found at ${SEED_STATE_PATH}. Run \`npm run seed:all\` first.`,
    )
  }
  cache = JSON.parse(readFileSync(SEED_STATE_PATH, 'utf8')) as CatalogSeedState
  return cache
}

/** Return one flow's seeded state, throwing a clear error if it is missing. */
export function getFlowState(flowId: string): FlowSeedState {
  const state = readSeedState()[flowId]
  if (!state) {
    throw new Error(
      `Flow "${flowId}" is missing from seed-state.json. Run \`npm run seed:all\`.`,
    )
  }
  return state
}

/** The seeded student for a flow (role === 'student', or the first user). */
export function getStudent(flowId: string): SeedTestUser {
  const state = getFlowState(flowId)
  const student =
    state.testUsers.find((user) => user.role === 'student') ??
    state.testUsers[0]
  if (!student) {
    throw new Error(`Flow "${flowId}" has no seeded users.`)
  }
  return student
}
