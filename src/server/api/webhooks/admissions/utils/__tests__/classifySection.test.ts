import { describe, expect, it } from 'vitest'

import { classifySection } from '@/server/api/webhooks/admissions/utils/classifySection'

const BATCH_ID = 42

function row(
  overrides: Partial<{
    batchId: number
    active: number
    deletedAt: string | null
  }> = {},
) {
  return {
    id: 1,
    batchId: BATCH_ID,
    active: 1,
    deletedAt: null,
    ...overrides,
  }
}

describe('classifySection', () => {
  it('returns null for an active, non-deleted section in the batch', () => {
    expect(classifySection(row(), BATCH_ID)).toBeNull()
  })

  it('flags a missing section as NOT_FOUND', () => {
    expect(classifySection(undefined, BATCH_ID)).toBe('NOT_FOUND')
  })

  it('flags a soft-deleted section as DELETED', () => {
    expect(
      classifySection(row({ deletedAt: '2026-01-01T00:00:00Z' }), BATCH_ID),
    ).toBe('DELETED')
  })

  it('flags an inactive section as INACTIVE', () => {
    expect(classifySection(row({ active: 0 }), BATCH_ID)).toBe('INACTIVE')
  })

  it('flags a section from another batch as BATCH_MISMATCH', () => {
    expect(classifySection(row({ batchId: 99 }), BATCH_ID)).toBe(
      'BATCH_MISMATCH',
    )
  })

  it('prioritizes DELETED over INACTIVE and BATCH_MISMATCH', () => {
    expect(
      classifySection(
        row({ deletedAt: '2026-01-01T00:00:00Z', active: 0, batchId: 99 }),
        BATCH_ID,
      ),
    ).toBe('DELETED')
  })
})
