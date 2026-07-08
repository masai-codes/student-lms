import { describe, expect, it } from 'vitest'

import { resolveLoginUserId, type FlowSeedState } from './seedState'

const flowState: FlowSeedState = {
  seededAt: '2026-07-02T10:00:00.000Z',
  testUsers: [
    { role: 'admin', email: 'a@example.com', password: 'p', userId: 1, name: 'A' },
    { role: 'student', email: 's@example.com', password: 'p', userId: 99, name: 'S' },
  ],
  timing: {},
  entityIds: {},
}

describe('resolveLoginUserId', () => {
  it('returns user id for primary role', () => {
    expect(resolveLoginUserId(flowState, 'student')).toBe(99)
  })

  it('falls back to first user', () => {
    expect(resolveLoginUserId(flowState, 'unknown')).toBe(1)
  })

  it('returns null without state', () => {
    expect(resolveLoginUserId(undefined, 'student')).toBeNull()
  })
})
