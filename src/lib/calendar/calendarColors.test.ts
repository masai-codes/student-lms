import { describe, expect, it } from 'vitest'
import { CALENDAR_TYPE_STYLES, calendarTypeStyle } from './calendarColors'

describe('calendarTypeStyle', () => {
  it('covers all three event types with distinct styles', () => {
    expect(CALENDAR_TYPE_STYLES.map((s) => s.type)).toEqual([
      'lecture',
      'assignment',
      'quiz',
    ])
    const dots = new Set(CALENDAR_TYPE_STYLES.map((s) => s.dotClass))
    expect(dots.size).toBe(3)
  })

  it('returns the matching style per type', () => {
    expect(calendarTypeStyle('quiz').label).toBe('Quiz')
    expect(calendarTypeStyle('lecture').dotClass).toBe('bg-brand')
  })
})
