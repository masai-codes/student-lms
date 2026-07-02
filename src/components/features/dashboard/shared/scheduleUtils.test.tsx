import { describe, expect, it } from 'vitest'
import { getScheduleTypeVisual } from './scheduleUtils'
import type { ScheduleItemType } from './types'

describe('getScheduleTypeVisual', () => {
  it.each<ScheduleItemType>(['lecture', 'assignment', 'notes'])(
    'returns an icon and colour class for %s',
    (type) => {
      const visual = getScheduleTypeVisual(type)
      expect(visual.Icon).toBeTypeOf('object')
      expect(visual.colorClass).toMatch(/^text-/)
    },
  )

  it('maps each type to a distinct colour', () => {
    const colours = (['lecture', 'assignment', 'notes'] as const).map(
      (type) => getScheduleTypeVisual(type).colorClass,
    )
    expect(new Set(colours).size).toBe(colours.length)
  })
})
