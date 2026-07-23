import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.select },
}))

vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdForSection: vi.fn(),
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: vi.fn(),
}))

import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { getSupportEntityContext } from '@/server/api/support/services/getSupportEntityContext.service'

function mockSelectChain(rows: unknown[]) {
  hoisted.select.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(rows),
      }),
    }),
  })
}

describe('getSupportEntityContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureUserCanAccessLearnHubEntity).mockResolvedValue(true)
    vi.mocked(getBatchIdForSection).mockResolvedValue(42)
  })

  it('maps a lecture to batch + item card fields', async () => {
    mockSelectChain([
      {
        id: 7,
        title: 'Intro to JS',
        type: 'live',
        optional: 0,
        schedule: '2026-01-15T10:00:00.000Z',
        week: 2,
        module: 'Module A',
        category: 'Core',
        sectionId: 99,
      },
    ])

    const result = await getSupportEntityContext(1, 'lecture', 7)

    expect(result).toMatchObject({
      batchId: 42,
      category: 'lecture',
      item: {
        id: 7,
        title: 'Intro to JS',
        meta: 'Module A',
        type: 'live',
      },
    })
  })

  it('maps evaluations to the evaluation support category', async () => {
    mockSelectChain([
      {
        id: 12,
        title: 'Midterm',
        type: 'evaluation',
        optional: 0,
        schedule: '2026-02-01T10:00:00.000Z',
        category: 'Eval',
        sectionId: 88,
      },
    ])

    const result = await getSupportEntityContext(1, 'evaluation', 12)

    expect(result.category).toBe('evaluation')
    expect(result.item.id).toBe(12)
  })

  it('rejects unknown categories', async () => {
    await expect(getSupportEntityContext(1, 'general', 1)).rejects.toThrow(
      'SUPPORT_INVALID_ENTITY_CATEGORY',
    )
  })
})
