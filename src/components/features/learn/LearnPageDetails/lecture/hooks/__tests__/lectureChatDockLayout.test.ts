import { describe, expect, it } from 'vitest'

import { shouldDockLectureChatAnchor } from '../lectureChatDockLayout'

describe('shouldDockLectureChatAnchor', () => {
  it('does not dock when the anchor is below the viewport on first paint', () => {
    expect(shouldDockLectureChatAnchor({ bottom: 920 })).toBe(false)
  })

  it('does not dock while the anchor is visible in the viewport', () => {
    expect(shouldDockLectureChatAnchor({ bottom: 420 })).toBe(false)
  })

  it('docks after the anchor scrolls above the viewport', () => {
    expect(shouldDockLectureChatAnchor({ bottom: 0 })).toBe(true)
    expect(shouldDockLectureChatAnchor({ bottom: -12 })).toBe(true)
  })
})
