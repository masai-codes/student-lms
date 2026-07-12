import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/generics', () => ({
  formatSqlDate: (value: string | null) => `fmt:${value}`,
}))

import { formatAssociatedMeta } from '../formatAssociatedMeta'

describe('formatAssociatedMeta', () => {
  it('returns null for null or blank schedules', () => {
    expect(formatAssociatedMeta(null)).toBeNull()
    expect(formatAssociatedMeta('   ')).toBeNull()
  })

  it('formats a populated schedule', () => {
    expect(formatAssociatedMeta('2026-01-01T10:00:00Z')).toBe(
      'fmt:2026-01-01T10:00:00Z',
    )
  })
})
