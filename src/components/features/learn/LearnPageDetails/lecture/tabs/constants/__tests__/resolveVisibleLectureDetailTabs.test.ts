import { describe, expect, it } from 'vitest'

import {
  LECTURE_DETAIL_TABS,
  resolveVisibleLectureDetailTabs,
} from '../staticLectureTabContent'

describe('resolveVisibleLectureDetailTabs', () => {
  it('includes the notes tab by default', () => {
    const tabs = resolveVisibleLectureDetailTabs(false)
    expect(tabs.some(tab => tab.id === 'notes')).toBe(true)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length)
  })

  it('removes the notes tab when hide_notes is enabled', () => {
    const tabs = resolveVisibleLectureDetailTabs(true)
    expect(tabs.some(tab => tab.id === 'notes')).toBe(false)
    expect(tabs).toHaveLength(LECTURE_DETAIL_TABS.length - 1)
  })
})
