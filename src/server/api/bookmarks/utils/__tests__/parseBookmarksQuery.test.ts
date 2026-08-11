import { describe, expect, it } from 'vitest'
import { parseBookmarksQuery } from '../parseBookmarksQuery'
import { BOOKMARKS_PER_PAGE } from '@/components/features/bookmarks/bookmarksConfig'

const parse = (query: string) =>
  parseBookmarksQuery(new URL(`https://x.test/api/bookmarks${query}`))

describe('parseBookmarksQuery', () => {
  it('applies defaults with no params', () => {
    expect(parse('')).toEqual({
      tab: 'lectures',
      page: 1,
      limit: BOOKMARKS_PER_PAGE,
      q: undefined,
      categories: [],
      modules: [],
      types: [],
      statuses: [],
      priorities: [],
      startDate: undefined,
      endDate: undefined,
    })
  })

  it('falls back to lectures for an unknown tab', () => {
    expect(parse('?tab=nope').tab).toBe('lectures')
    expect(parse('?tab=tickets').tab).toBe('lectures')
  })

  it('parses csv filter params (trimmed + deduped)', () => {
    const r = parse(
      '?tab=tickets&category=Billing,%20Billing&status=open,closed&priority=high',
    )
    expect(r.categories).toEqual(['Billing'])
    expect(r.statuses).toEqual(['open', 'closed'])
    expect(r.priorities).toEqual(['high'])
  })

  it('parses valid dates and rejects invalid ones', () => {
    expect(parse('?startDate=2026-07-01&endDate=2026-07-31')).toMatchObject({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
    expect(parse('?startDate=2026-13-40&endDate=nope')).toMatchObject({
      startDate: undefined,
      endDate: undefined,
    })
  })
})
