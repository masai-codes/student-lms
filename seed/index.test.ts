import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  resetDatabase: vi.fn(),
  getFlow: vi.fn(),
  seedFlowIds: ['flow-a', 'flow-b', 'flow-c'],
}))

vi.mock('./resetDatabase', () => ({
  resetDatabase: hoisted.resetDatabase,
}))

vi.mock('./registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('./registry')>()
  return {
    ...original,
    getFlow: hoisted.getFlow,
    seedFlowIds: hoisted.seedFlowIds,
  }
})

import { seedAllFlows } from './index'

function mockFlowResult(flowId: string) {
  return {
    flowId,
    entities: { batch: { id: flowId.length } },
    testUsers: [
      {
        role: 'student',
        email: `${flowId}.student@example.com`,
        password: 'password',
        userId: flowId.length,
        name: 'Student',
      },
    ],
    timing: {},
  }
}

describe('seedAllFlows', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL

  beforeEach(() => {
    process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/student_lms_test'
    hoisted.resetDatabase.mockReset()
    hoisted.getFlow.mockReset()
    hoisted.getFlow.mockImplementation(async (flowId: string) => ({
      meta: { id: flowId },
      seed: async () => mockFlowResult(flowId),
    }))
  })

  afterAll(() => {
    process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('resets once and runs every registered flow in order', async () => {
    const results = await seedAllFlows()

    expect(hoisted.resetDatabase).toHaveBeenCalledOnce()
    expect(hoisted.getFlow).toHaveBeenCalledTimes(3)
    expect(hoisted.getFlow.mock.calls.map(([id]) => id)).toEqual(hoisted.seedFlowIds)
    expect(results.map((result) => result.flowId)).toEqual(hoisted.seedFlowIds)
  })

  it('skips reset when reset is false', async () => {
    await seedAllFlows({ reset: false })

    expect(hoisted.resetDatabase).not.toHaveBeenCalled()
    expect(hoisted.getFlow).toHaveBeenCalledTimes(3)
  })
})
