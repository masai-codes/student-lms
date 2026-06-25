import { describe, expect, it } from 'vitest'

import {
  LECTURE_DETAIL_TABS,
  resolveDefaultLectureTabId,
  resolveVisibleLectureDetailTabs,
} from '../staticLectureTabContent'

describe('resolveVisibleLectureDetailTabs', () => {
  it('includes the description tab by default', () => {
    const tabs = resolveVisibleLectureDetailTabs(false)
    expect(tabs.some(tab => tab.id === 'description')).toBe(true)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length)
  })

  it('removes the description tab when hide_notes is enabled', () => {
    const tabs = resolveVisibleLectureDetailTabs(true)
    expect(tabs.some(tab => tab.id === 'description')).toBe(false)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length - 1)
  })

  it('does not expose a separate notes tab', () => {
    expect(LECTURE_DETAIL_TABS.some(tab => tab.id === ('notes' as string))).toBe(
      false,
    )
  })
})

describe('resolveDefaultLectureTabId', () => {
  it('defaults to description when notes are shown', () => {
    expect(resolveDefaultLectureTabId(false)).toBe('description')
  })

  it('falls back to the first visible tab when notes are hidden', () => {
    expect(resolveDefaultLectureTabId(true)).toBe('ai-summary')
  })
})
