import { describe, expect, it } from 'vitest'

import { formatCatchUpRemainingLabel } from '../formatCatchUpRemainingLabel'

describe('formatCatchUpRemainingLabel', () => {
  it('renders the whole-day count (legacy LMS parity)', () => {
    expect(formatCatchUpRemainingLabel(317)).toBe('317 days remaining')
    expect(formatCatchUpRemainingLabel(3)).toBe('3 days remaining')
  })

  it('renders a zero-day label', () => {
    expect(formatCatchUpRemainingLabel(0)).toBe('0 days remaining')
  })

  it('returns null when nothing is available', () => {
    expect(formatCatchUpRemainingLabel(null)).toBeNull()
    expect(formatCatchUpRemainingLabel(-1)).toBeNull()
  })
})
