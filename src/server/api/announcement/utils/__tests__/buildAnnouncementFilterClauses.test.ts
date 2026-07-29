import { describe, expect, it } from 'vitest'
import { MySqlDialect } from 'drizzle-orm/mysql-core'
import { buildAnnouncementFilterClauses } from '../buildAnnouncementFilterClauses'

const dialect = new MySqlDialect()
const render = (fragment: Parameters<typeof dialect.sqlToQuery>[0]) =>
  dialect.sqlToQuery(fragment)

const EMPTY = { types: [], categories: [], announcedBy: [] }

describe('buildAnnouncementFilterClauses', () => {
  it('returns empty fragments when nothing is selected', () => {
    const { announcement, message } = buildAnnouncementFilterClauses(EMPTY)
    expect(render(announcement).sql).toBe('')
    expect(render(message).sql).toBe('')
  })

  it('builds type + category IN clauses on both sources', () => {
    const { announcement, message } = buildAnnouncementFilterClauses({
      ...EMPTY,
      types: ['critical', 'info'],
      categories: ['DSA'],
    })
    const a = render(announcement)
    expect(a.sql).toContain('a.type IN (?, ?)')
    expect(a.sql).toContain('a.category IN (?)')
    expect(a.params).toEqual(['critical', 'info', 'DSA'])

    const m = render(message)
    expect(m.sql).toContain(
      "JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) IN (?, ?)",
    )
    expect(m.sql).toContain(
      "JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.category')) IN (?)",
    )
  })

  it('filters by author on user_id / author_id', () => {
    const { announcement, message } = buildAnnouncementFilterClauses({
      ...EMPTY,
      announcedBy: ['42', '7'],
    })
    expect(render(announcement).sql).toContain('a.user_id IN (?, ?)')
    expect(render(message).sql).toContain('m.author_id IN (?, ?)')
    expect(render(announcement).params).toEqual(['42', '7'])
  })

  it('applies an announced-date range on the schedule (fallback created_at)', () => {
    const { announcement, message } = buildAnnouncementFilterClauses({
      ...EMPTY,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
    const a = render(announcement)
    expect(a.sql).toContain('COALESCE(a.schedule, a.created_at)')
    expect(a.sql).toContain('BETWEEN ? AND ?')
    expect(a.params).toEqual(['2026-07-01', '2026-07-31'])
    expect(render(message).sql).toContain('COALESCE(m.schedule, m.created_at)')
  })

  it('supports single-bound date ranges', () => {
    expect(
      render(
        buildAnnouncementFilterClauses({ ...EMPTY, startDate: '2026-07-01' })
          .announcement,
      ).sql,
    ).toContain('>= ?')
    expect(
      render(
        buildAnnouncementFilterClauses({ ...EMPTY, endDate: '2026-07-31' })
          .announcement,
      ).sql,
    ).toContain('<= ?')
  })
})
