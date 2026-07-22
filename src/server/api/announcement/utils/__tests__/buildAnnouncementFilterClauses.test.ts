import { describe, expect, it } from 'vitest'
import { MySqlDialect } from 'drizzle-orm/mysql-core'
import { buildAnnouncementFilterClauses } from '../buildAnnouncementFilterClauses'

const dialect = new MySqlDialect()
const render = (fragment: Parameters<typeof dialect.sqlToQuery>[0]) =>
  dialect.sqlToQuery(fragment)

describe('buildAnnouncementFilterClauses', () => {
  it('returns empty fragments when no filters are selected', () => {
    const { announcement, message } = buildAnnouncementFilterClauses([], [])
    expect(render(announcement).sql).toBe('')
    expect(render(announcement).params).toEqual([])
    expect(render(message).sql).toBe('')
    expect(render(message).params).toEqual([])
  })

  it('builds a parameterized IN clause for types on both sources', () => {
    const { announcement, message } = buildAnnouncementFilterClauses(
      ['critical', 'info'],
      [],
    )
    const a = render(announcement)
    expect(a.sql).toContain('a.type IN (?, ?)')
    expect(a.params).toEqual(['critical', 'info'])

    const m = render(message)
    expect(m.sql).toContain(
      "JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) IN (?, ?)",
    )
    expect(m.params).toEqual(['critical', 'info'])
  })

  it('builds a parameterized IN clause for categories on both sources', () => {
    const { announcement, message } = buildAnnouncementFilterClauses(
      [],
      ['DSA'],
    )
    expect(render(announcement).sql).toContain('a.category IN (?)')
    expect(render(message).sql).toContain(
      "JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.category')) IN (?)",
    )
    expect(render(announcement).params).toEqual(['DSA'])
  })

  it('combines type and category clauses in order', () => {
    const { announcement } = buildAnnouncementFilterClauses(
      ['critical'],
      ['DSA', 'General'],
    )
    const a = render(announcement)
    expect(a.sql).toContain('a.type IN (?)')
    expect(a.sql).toContain('a.category IN (?, ?)')
    expect(a.params).toEqual(['critical', 'DSA', 'General'])
  })
})
