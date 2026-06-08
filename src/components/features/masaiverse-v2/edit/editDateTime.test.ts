import { describe, expect, it } from 'vitest'
import { istLocalInputToUtcIso, utcIsoToIstLocalInput } from './editDateTime'

describe('editDateTime', () => {
  it('converts a UTC ISO timestamp to an IST datetime-local value', () => {
    // 09:00 UTC is 14:30 IST.
    expect(utcIsoToIstLocalInput('2026-06-10T09:00:00.000Z')).toBe(
      '2026-06-10T14:30',
    )
  })

  it('returns empty for a missing or invalid value', () => {
    expect(utcIsoToIstLocalInput(null)).toBe('')
    expect(utcIsoToIstLocalInput('')).toBe('')
    expect(utcIsoToIstLocalInput('not-a-date')).toBe('')
  })

  it('converts an IST datetime-local value back to a UTC ISO timestamp', () => {
    expect(istLocalInputToUtcIso('2026-06-10T14:30')).toBe(
      '2026-06-10T09:00:00.000Z',
    )
  })

  it('round-trips a value through both conversions', () => {
    const iso = '2026-12-31T18:45:00.000Z'
    expect(istLocalInputToUtcIso(utcIsoToIstLocalInput(iso))).toBe(iso)
  })

  it('returns null for a blank datetime-local value', () => {
    expect(istLocalInputToUtcIso('')).toBeNull()
  })
})
