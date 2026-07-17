import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildSimulatedOnwardStatus } from './buildSimulatedOnwardStatus'
import { readOnwardFixtures, writeOnwardFixture } from './onwardFixtureStore'

describe('onwardFixtureStore', () => {
  let dir: string
  let fixturePath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'onward-fixtures-'))
    fixturePath = join(dir, 'onward-fixtures.json')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns an empty registry when no fixture file exists yet', () => {
    expect(readOnwardFixtures(fixturePath)).toEqual({})
  })

  it('writes and reads back a fixture keyed by student_code', () => {
    const status = buildSimulatedOnwardStatus({
      documentsRequired: true,
      kitShowKit: true,
    })
    writeOnwardFixture('onboarding-fees-paid-student', status, fixturePath)

    expect(readOnwardFixtures(fixturePath)).toEqual({
      'onboarding-fees-paid-student': status,
    })
  })

  it('upserts without clobbering other students', () => {
    writeOnwardFixture(
      'student-a',
      buildSimulatedOnwardStatus({ documentsRequired: true }),
      fixturePath,
    )
    writeOnwardFixture(
      'student-b',
      buildSimulatedOnwardStatus({ kitShowKit: true }),
      fixturePath,
    )

    const fixtures = readOnwardFixtures(fixturePath)
    expect(Object.keys(fixtures).sort()).toEqual(['student-a', 'student-b'])
    expect(fixtures['student-a'].documents.required).toBe(true)
    expect(fixtures['student-b'].kit.showKit).toBe(true)
  })
})
