import { describe, expect, it } from 'vitest'
import { formatTimeRemaining } from './formatTimeRemaining'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatTimeRemaining', () => {
  it('shows days + hours when a day or more is left', () => {
    expect(formatTimeRemaining(2 * DAY + 3 * HOUR + 40 * MINUTE)).toBe(
      '2 days 3 hours remaining',
    )
  })

  it('drops the hours unit when it is zero', () => {
    expect(formatTimeRemaining(3 * DAY)).toBe('3 days remaining')
  })

  it('uses singular units', () => {
    expect(formatTimeRemaining(DAY + HOUR)).toBe('1 day 1 hour remaining')
  })

  it('shows hours + minutes under a day', () => {
    expect(formatTimeRemaining(3 * HOUR + 20 * MINUTE)).toBe(
      '3 hours 20 minutes remaining',
    )
  })

  it('shows minutes only under an hour', () => {
    expect(formatTimeRemaining(20 * MINUTE)).toBe('20 minutes remaining')
  })

  it('never renders zero minutes for a sub-minute remainder', () => {
    expect(formatTimeRemaining(30_000)).toBe('1 minute remaining')
  })

  it('returns null for non-positive or non-finite input', () => {
    expect(formatTimeRemaining(0)).toBeNull()
    expect(formatTimeRemaining(-5)).toBeNull()
    expect(formatTimeRemaining(Number.NaN)).toBeNull()
  })
})
