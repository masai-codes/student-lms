import { describe, expect, it } from 'vitest'
import type { NavItem } from './navItemConfig'
import { resolveNavItemPriority } from './resolveNavItemPriority'

function link(id: string, uiType: NavItem['uiType']): NavItem {
  return { id, uiType, type: 'internal-link', to: `/${id}` }
}

describe('resolveNavItemPriority', () => {
  it('returns empty buckets for empty input', () => {
    expect(resolveNavItemPriority([])).toEqual({
      primary: [],
      secondary: [],
      tertiary: [],
    })
  })

  it('collapses multiple primaries: only the first stays primary, rest demote to secondary', () => {
    const items = [
      link('get-app', 'primary'),
      link('refer', 'primary'),
      link('bookmarks', 'secondary'),
    ]

    const result = resolveNavItemPriority(items)

    expect(result.primary).toEqual([items[0]])
    expect(result.secondary).toEqual([items[1], items[2]])
    expect(result.tertiary).toEqual([])
  })

  it('separates tertiary items into their own bucket regardless of position', () => {
    const items = [
      link('my-profile', 'tertiary'),
      link('home', 'primary'),
      link('sign-out', 'tertiary'),
    ]

    const result = resolveNavItemPriority(items)

    expect(result.tertiary).toEqual([items[0], items[2]])
    expect(result.primary).toEqual([items[1]])
    expect(result.secondary).toEqual([])
  })

  it('preserves input order within each bucket', () => {
    const items = [
      link('a', 'secondary'),
      link('b', 'primary'),
      link('c', 'secondary'),
      link('d', 'primary'),
      link('e', 'tertiary'),
    ]

    const result = resolveNavItemPriority(items)

    expect(result.primary.map((i) => i.id)).toEqual(['b'])
    expect(result.secondary.map((i) => i.id)).toEqual(['a', 'c', 'd'])
    expect(result.tertiary.map((i) => i.id)).toEqual(['e'])
  })

  it('leaves an already-secondary-only list unchanged in shape', () => {
    const items = [link('a', 'secondary'), link('b', 'secondary')]
    const result = resolveNavItemPriority(items)
    expect(result.primary).toEqual([])
    expect(result.secondary).toEqual(items)
  })
})
