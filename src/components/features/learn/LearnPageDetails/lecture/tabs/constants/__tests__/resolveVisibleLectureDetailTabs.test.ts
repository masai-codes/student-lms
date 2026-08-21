import { describe, expect, it } from 'vitest'

import {
  LECTURE_DETAIL_TABS,
  resolveDefaultLectureTabId,
  resolveVisibleLectureDetailTabs,
} from '../staticLectureTabContent'

describe('resolveVisibleLectureDetailTabs', () => {
  it('includes the description tab by default', () => {
    const tabs = resolveVisibleLectureDetailTabs(false)
    expect(tabs.some((tab) => tab.id === 'description')).toBe(true)
    // attempted-assessments is opt-in (defaults to hidden), so this is one
    // short of the full LECTURE_DETAIL_TABS list.
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length - 1)
  })

  it('removes the description tab when hide_notes is enabled', () => {
    const tabs = resolveVisibleLectureDetailTabs(true)
    expect(tabs.some((tab) => tab.id === 'description')).toBe(false)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length - 2)
  })

  it('does not expose a separate notes tab', () => {
    expect(
      LECTURE_DETAIL_TABS.some((tab) => tab.id === ('notes' as string)),
    ).toBe(false)
  })

  it('does not expose a sql-playground tab (it is a drawer, not a tab)', () => {
    expect(
      LECTURE_DETAIL_TABS.some(
        (tab) => tab.id === ('sql-playground' as string),
      ),
    ).toBe(false)
  })

  it('hides attempted-assessments by default', () => {
    const tabs = resolveVisibleLectureDetailTabs(false)
    expect(tabs.some((tab) => tab.id === 'attempted-assessments')).toBe(false)
  })

  it('shows attempted-assessments when the user has a submitted quiz', () => {
    const tabs = resolveVisibleLectureDetailTabs(false, true)
    expect(tabs.some((tab) => tab.id === 'attempted-assessments')).toBe(true)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length)
  })
})

describe('resolveDefaultLectureTabId', () => {
  it('defaults to description when notes are shown', () => {
    expect(resolveDefaultLectureTabId(false)).toBe('description')
  })

  it('falls back to the first visible tab when notes are hidden', () => {
    expect(resolveDefaultLectureTabId(true)).toBe('ai-summary')
  })

  it('does not default onto attempted-assessments even when it is enabled', () => {
    expect(resolveDefaultLectureTabId(false, true)).toBe('description')
  })
})
