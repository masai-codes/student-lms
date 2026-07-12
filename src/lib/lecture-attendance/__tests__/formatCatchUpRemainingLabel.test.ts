import { describe, expect, it } from 'vitest'

import { formatCatchUpRemainingLabel } from '../formatCatchUpRemainingLabel'

describe('formatCatchUpRemainingLabel', () => {
  it('prefers the granular server label when present', () => {
    expect(formatCatchUpRemainingLabel('28 days remaining', 29)).toBe(
      '28 days remaining',
    )
  })

  it('falls back to the whole-day integer when no label', () => {
    expect(formatCatchUpRemainingLabel(null, 3)).toBe('3 days remaining')
  })

  it('renders a zero-day fallback', () => {
    expect(formatCatchUpRemainingLabel(null, 0)).toBe('0 days remaining')
  })

  it('returns null when nothing is available', () => {
    expect(formatCatchUpRemainingLabel(null, null)).toBeNull()
    expect(formatCatchUpRemainingLabel(null, -1)).toBeNull()
  })
})
