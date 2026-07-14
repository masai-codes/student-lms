import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SimulatedOnwardStatus } from './types'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Keyed by `student_code` — the same `users.username` value `getAdmissionsStudentStatus` sends as `student_code`. */
export type OnwardFixtures = Record<string, SimulatedOnwardStatus>

/**
 * Reads the fixture registry `onwardMockServer` serves from.
 * `path` is overridable for tests; defaults to the on-disk fixture file
 * seeded flows write to.
 */
export function readOnwardFixtures(
  path: string = defaultFixturePath(),
): OnwardFixtures {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as OnwardFixtures
  } catch {
    return {}
  }
}

/** Upserts one student's simulated onward response into the fixture registry. */
export function writeOnwardFixture(
  studentCode: string,
  status: SimulatedOnwardStatus,
  path: string = defaultFixturePath(),
): OnwardFixtures {
  const next: OnwardFixtures = {
    ...readOnwardFixtures(path),
    [studentCode]: status,
  }
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  return next
}

function defaultFixturePath(): string {
  return join(__dirname, 'onward-fixtures.json')
}

export const ONWARD_FIXTURE_PATH = defaultFixturePath()
