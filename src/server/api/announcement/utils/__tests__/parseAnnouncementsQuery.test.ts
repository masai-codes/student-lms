import { describe, expect, it } from 'vitest'
import { parseAnnouncementsQuery } from '../parseAnnouncementsQuery'
import { ANNOUNCEMENTS_PER_PAGE } from '@/components/features/announcements/announcementsConfig'

const parse = (query: string) =>
  parseAnnouncementsQuery(new URL(`https://x.test/api/announcement${query}`))

describe('parseAnnouncementsQuery', () => {
  it('applies defaults when no params are present', () => {
    expect(parse('')).toEqual({
      page: 1,
      limit: ANNOUNCEMENTS_PER_PAGE,
      q: undefined,
      messagesOnly: false,
      types: [],
      categories: [],
      announcedBy: [],
      startDate: undefined,
      endDate: undefined,
    })
  })

  it('parses announcedBy + announced-date range', () => {
    const r = parse(
      '?announcedBy=42,7,42&startDate=2026-07-01&endDate=2026-07-31',
    )
    expect(r.announcedBy).toEqual(['42', '7'])
    expect(r.startDate).toBe('2026-07-01')
    expect(r.endDate).toBe('2026-07-31')
    expect(parse('?startDate=nope').startDate).toBeUndefined()
  })

  it('parses page, limit, q and message flag', () => {
    expect(parse('?page=3&limit=5&q=%20react%20&message=true')).toMatchObject({
      page: 3,
      limit: 5,
      q: 'react',
      messagesOnly: true,
    })
  })

  it('falls back to defaults for invalid page/limit and blank q', () => {
    expect(parse('?page=0&limit=-2&q=%20%20&message=false')).toMatchObject({
      page: 1,
      limit: ANNOUNCEMENTS_PER_PAGE,
      q: undefined,
      messagesOnly: false,
    })
  })

  it('parses comma-separated type and category filters, trimmed and deduped', () => {
    const result = parse(
      '?type=critical,%20info%20,critical&category=DSA,General',
    )
    expect(result.types).toEqual(['critical', 'info'])
    expect(result.categories).toEqual(['DSA', 'General'])
  })

  it('treats empty filter params as no filter', () => {
    const result = parse('?type=&category=%20,%20')
    expect(result.types).toEqual([])
    expect(result.categories).toEqual([])
  })
})
