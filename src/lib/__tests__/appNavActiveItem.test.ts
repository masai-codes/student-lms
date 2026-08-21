import { describe, expect, it } from 'vitest'

import { activeAppNavIdForPathname } from '../appNavActiveItem'

describe('activeAppNavIdForPathname', () => {
  it('maps in-app routes to nav ids', () => {
    expect(activeAppNavIdForPathname('/')).toBe('home')
    expect(activeAppNavIdForPathname('/learn')).toBe('learn')
    expect(activeAppNavIdForPathname('/learn?batchId=1')).toBe('learn')
    expect(activeAppNavIdForPathname('/lectures/42')).toBe('learn')
    expect(activeAppNavIdForPathname('/assignments/1')).toBe('learn')
    expect(activeAppNavIdForPathname('/resources/3')).toBe('learn')
    expect(activeAppNavIdForPathname('/masaiverse')).toBe('community')
    expect(activeAppNavIdForPathname('/masaiverse/events')).toBe('community')
  })

  it('returns undefined for legacy-only paths', () => {
    expect(activeAppNavIdForPathname('/support')).toBeUndefined()
    expect(activeAppNavIdForPathname('/discussions')).toBeUndefined()
  })
})
