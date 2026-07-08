import { describe, expect, it } from 'vitest'
import { formatTimeRemaining } from './formatTimeRemaining'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatTimeRemaining', () => {
  it('shows days only when a day or more is left', () => {
    expect(formatTimeRemaining(2 * DAY + 3 * HOUR + 40 * MINUTE)).toBe('2 days remaining')
  })

  it('uses singular day', () => {
    expect(formatTimeRemaining(DAY + HOUR)).toBe('1 day remaining')
  })

  it('shows hr + min under a day', () => {
    expect(formatTimeRemaining(3 * HOUR + 20 * MINUTE)).toBe('3 hr 20 min remaining')
  })

  it('drops the min unit when it is zero', () => {
    expect(formatTimeRemaining(3 * HOUR)).toBe('3 hr remaining')
  })

  it('shows minutes only under an hour', () => {
    expect(formatTimeRemaining(20 * MINUTE)).toBe('20 min remaining')
  })

  it('never renders zero minutes for a sub-minute remainder', () => {
    expect(formatTimeRemaining(30_000)).toBe('1 min remaining')
  })

  it('returns null for non-positive or non-finite input', () => {
    expect(formatTimeRemaining(0)).toBeNull()
    expect(formatTimeRemaining(-5)).toBeNull()
    expect(formatTimeRemaining(Number.NaN)).toBeNull()
  })
})
