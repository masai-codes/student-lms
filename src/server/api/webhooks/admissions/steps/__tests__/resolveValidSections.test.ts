import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveValidSections } from '@/server/api/webhooks/admissions/steps/resolveValidSections'

const state = vi.hoisted(() => ({ rows: [] as unknown[] }))

// Stub the drizzle builder chain: db.select().from().where() resolves to `rows`.
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => Promise.resolve(state.rows) }),
    }),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const BATCH_ID = 10

beforeEach(() => {
  state.rows = []
})

describe('resolveValidSections', () => {
  it('keeps valid sections and tags each invalid one with a reason', async () => {
    state.rows = [
      { id: 1, batchId: BATCH_ID, active: 1, deletedAt: null },
      { id: 2, batchId: BATCH_ID, active: 0, deletedAt: null },
      {
        id: 3,
        batchId: BATCH_ID,
        active: 1,
        deletedAt: '2026-01-01T00:00:00Z',
      },
      { id: 4, batchId: 99, active: 1, deletedAt: null },
    ]

    const result = await resolveValidSections(BATCH_ID, [1, 2, 3, 4, 5])

    expect(result.validSectionIds).toEqual([1])
    expect(result.invalidSectionIds).toEqual([
      { sectionId: 2, reason: 'INACTIVE' },
      { sectionId: 3, reason: 'DELETED' },
      { sectionId: 4, reason: 'BATCH_MISMATCH' },
      { sectionId: 5, reason: 'NOT_FOUND' },
    ])
  })

  it('deduplicates repeated section ids', async () => {
    state.rows = [{ id: 1, batchId: BATCH_ID, active: 1, deletedAt: null }]

    const result = await resolveValidSections(BATCH_ID, [1, 1, 1])

    expect(result.validSectionIds).toEqual([1])
    expect(result.invalidSectionIds).toEqual([])
  })
})
