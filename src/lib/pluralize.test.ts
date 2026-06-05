import { describe, expect, it } from 'vitest'
import { formatMemberCount, pluralize } from './pluralize'

describe('pluralize', () => {
  it('returns the singular for exactly 1', () => {
    expect(pluralize(1, 'member')).toBe('member')
  })

  it('returns the plural for 0 and for counts above 1', () => {
    expect(pluralize(0, 'member')).toBe('members')
    expect(pluralize(2, 'member')).toBe('members')
  })

  it('supports an explicit irregular plural', () => {
    expect(pluralize(1, 'person', 'people')).toBe('person')
    expect(pluralize(3, 'person', 'people')).toBe('people')
  })
})

describe('formatMemberCount', () => {
  it('uses the singular label for a single member', () => {
    expect(formatMemberCount(1)).toBe('1 member')
  })

  it('uses the plural label and Indian grouping otherwise', () => {
    expect(formatMemberCount(0)).toBe('0 members')
    expect(formatMemberCount(234)).toBe('234 members')
    expect(formatMemberCount(12345)).toBe('12,345 members')
  })
})
