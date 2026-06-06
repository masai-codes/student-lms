import { describe, expect, it } from 'vitest'
import {
  getAvatarPalette,
  getInitials,
  getRankMedal,
} from './clubLeaderboardAvatar'

describe('getInitials', () => {
  it('takes up to two uppercased initials', () => {
    expect(getInitials('Priya Rajan')).toBe('PR')
    expect(getInitials('  arjun  kumar  mehta ')).toBe('AK')
    expect(getInitials('Nisha')).toBe('N')
  })

  it('falls back to "?" for a blank name', () => {
    expect(getInitials('   ')).toBe('?')
  })
})

describe('getAvatarPalette', () => {
  it('is deterministic for a given user id', () => {
    expect(getAvatarPalette('42')).toEqual(getAvatarPalette('42'))
  })

  it('returns a palette with bg and text colors', () => {
    const palette = getAvatarPalette('1001')
    expect(typeof palette.bg).toBe('string')
    expect(typeof palette.text).toBe('string')
  })
})

describe('getRankMedal', () => {
  it('returns medals for the top three ranks and null otherwise', () => {
    expect(getRankMedal(1)).toBe('🥇')
    expect(getRankMedal(2)).toBe('🥈')
    expect(getRankMedal(3)).toBe('🥉')
    expect(getRankMedal(4)).toBeNull()
  })
})
