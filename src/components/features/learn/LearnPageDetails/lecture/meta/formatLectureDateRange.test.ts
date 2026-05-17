import { describe, expect, it } from 'vitest'

import { formatLectureDateRange } from './formatLectureDateRange'

describe('formatLectureDateRange', () => {
  it('formats same-day range with shared date', () => {
    const result = formatLectureDateRange(
      '2026-05-10T10:00:00.000Z',
      '2026-05-10T12:00:00.000Z',
    )
    expect(result).toMatch(/10 May 2026/)
    expect(result).toContain('–')
  })

  it('formats cross-day range with both endpoints', () => {
    const result = formatLectureDateRange(
      '2026-05-10T10:00:00.000Z',
      '2026-05-11T12:00:00.000Z',
    )
    expect(result).toMatch(/10 May 2026/)
    expect(result).toMatch(/11 May 2026/)
    expect(result).toContain('–')
  })

  it('returns empty string for invalid dates', () => {
    expect(formatLectureDateRange('invalid', '2026-05-10T12:00:00.000Z')).toBe('')
    expect(formatLectureDateRange('2026-05-10T10:00:00.000Z', 'invalid')).toBe('')
  })
})
