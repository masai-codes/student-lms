import { describe, expect, it } from 'vitest'
import {
  NO_COURSE_LABEL,
  NO_MODULE_LABEL,
  buildBadgeShareUrl,
  groupAchievements,
  resolveSelection,
  sortLockedLast,
} from '@/components/features/profile/achievements/groupAchievements'
import type { AchievementItem } from '@/server/api/profile/profile.types'

function item(overrides: Partial<AchievementItem> = {}): AchievementItem {
  return {
    badgeConfigId: 1,
    badgeId: 1,
    releaseDate: '2026-01-01',
    count: 1,
    isLocked: false,
    courseTitle: 'Full Stack',
    sectionModuleName: 'Module 1',
    shareKey: 'key-1',
    badge: {
      id: 1,
      title: 'First Steps',
      description: 'Completed your first lecture',
      image: 'https://cdn.example/badge.png',
      linkedinShareText: null,
      lockedDescription: null,
      theme: 'theme1',
    },
    ...overrides,
  }
}

describe('sortLockedLast', () => {
  it('moves locked badges behind earned ones without reordering within a group', () => {
    const result = sortLockedLast([
      item({ badgeConfigId: 1, isLocked: true }),
      item({ badgeConfigId: 2 }),
      item({ badgeConfigId: 3, isLocked: true }),
      item({ badgeConfigId: 4 }),
    ])
    expect(result.map((entry) => entry.badgeConfigId)).toEqual([2, 4, 1, 3])
  })

  it('does not mutate the input', () => {
    const input = [item({ isLocked: true }), item({ badgeConfigId: 2 })]
    sortLockedLast(input)
    expect(input[0].isLocked).toBe(true)
  })
})

describe('groupAchievements', () => {
  it('returns nothing for an empty list', () => {
    expect(groupAchievements([])).toEqual([])
  })

  it('groups by course then module, counting each level', () => {
    const groups = groupAchievements([
      item({ badgeConfigId: 1, courseTitle: 'A', sectionModuleName: 'M1' }),
      item({ badgeConfigId: 2, courseTitle: 'A', sectionModuleName: 'M1' }),
      item({ badgeConfigId: 3, courseTitle: 'A', sectionModuleName: 'M2' }),
      item({ badgeConfigId: 4, courseTitle: 'B', sectionModuleName: 'M1' }),
    ])

    expect(groups.map((group) => [group.name, group.count])).toEqual([
      ['A', 3],
      ['B', 1],
    ])
    expect(groups[0].modules.map((m) => [m.name, m.count])).toEqual([
      ['M1', 2],
      ['M2', 1],
    ])
  })

  it('falls back to placeholder labels for missing course/module names', () => {
    const groups = groupAchievements([
      item({ courseTitle: null, sectionModuleName: null }),
      item({ badgeConfigId: 2, courseTitle: '  ', sectionModuleName: '  ' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe(NO_COURSE_LABEL)
    expect(groups[0].modules[0].name).toBe(NO_MODULE_LABEL)
    expect(groups[0].count).toBe(2)
  })

  it('sorts locked badges last within each module', () => {
    const groups = groupAchievements([
      item({ badgeConfigId: 1, isLocked: true }),
      item({ badgeConfigId: 2 }),
    ])
    expect(groups[0].modules[0].items.map((i) => i.badgeConfigId)).toEqual([
      2, 1,
    ])
  })
})

describe('resolveSelection', () => {
  const options = [{ name: 'A' }, { name: 'B' }]

  it('keeps a still-valid selection', () => {
    expect(resolveSelection('B', options)).toBe('B')
  })

  it('falls back to the first option when the selection is stale', () => {
    expect(resolveSelection('Gone', options)).toBe('A')
  })

  it('falls back to the first option when nothing is selected', () => {
    expect(resolveSelection(null, options)).toBe('A')
  })

  it('returns null when there is nothing to select', () => {
    expect(resolveSelection('A', [])).toBeNull()
  })
})

describe('buildBadgeShareUrl', () => {
  it('builds the landing URL from base and key', () => {
    expect(buildBadgeShareUrl('https://api.example', 'abc.sig')).toBe(
      'https://api.example/badge/abc.sig',
    )
  })

  it('returns null when either half is missing', () => {
    expect(buildBadgeShareUrl(null, 'abc')).toBeNull()
    expect(buildBadgeShareUrl('https://api.example', null)).toBeNull()
  })
})
