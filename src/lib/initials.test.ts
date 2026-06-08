import { describe, expect, it } from 'vitest'
import { getInitials } from './initials'

describe('getInitials', () => {
  it('uses the first letter of the first two words', () => {
    expect(getInitials('Aman Kumar')).toBe('AK')
    expect(getInitials('Arjun Pandey Singh')).toBe('AP')
  })

  it('takes the first two letters of a single word', () => {
    expect(getInitials('Programming')).toBe('PR')
  })

  it('falls back to "?" for an empty name', () => {
    expect(getInitials('   ')).toBe('?')
  })
})
