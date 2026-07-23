import { describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { MySqlDialect } from 'drizzle-orm/mysql-core'
import {
  buildInClauses,
  buildLectureTypeClause,
  buildSavedDateClause,
} from '../buildBookmarkFilterClauses'

const dialect = new MySqlDialect()
const render = (fragment: Parameters<typeof dialect.sqlToQuery>[0]) =>
  dialect.sqlToQuery(fragment)

describe('buildInClauses', () => {
  it('returns an empty fragment when no spec has values', () => {
    const out = render(
      buildInClauses([{ column: sql`l.category`, values: [] }]),
    )
    expect(out.sql).toBe('')
    expect(out.params).toEqual([])
  })

  it('builds parameterized IN clauses for each non-empty spec', () => {
    const out = render(
      buildInClauses([
        { column: sql`l.category`, values: ['DSA', 'Coding'] },
        { column: sql`l.module`, values: [] },
        { column: sql`t.status`, values: ['open'] },
      ]),
    )
    expect(out.sql).toContain('l.category IN (?, ?)')
    expect(out.sql).not.toContain('l.module')
    expect(out.sql).toContain('t.status IN (?)')
    expect(out.params).toEqual(['DSA', 'Coding', 'open'])
  })
})

describe('buildLectureTypeClause', () => {
  it('applies no filter when both or neither type is selected', () => {
    expect(render(buildLectureTypeClause([])).sql).toBe('')
    expect(render(buildLectureTypeClause(['lecture', 'resource'])).sql).toBe('')
  })

  it('filters to reading rows for resource only', () => {
    expect(render(buildLectureTypeClause(['resource'])).sql).toContain(
      "l.type = 'reading'",
    )
  })

  it('excludes reading rows for lecture only', () => {
    expect(render(buildLectureTypeClause(['lecture'])).sql).toContain(
      "l.type <> 'reading' OR l.type IS NULL",
    )
  })
})

describe('buildSavedDateClause', () => {
  const col = sql`b.created_at`

  it('is empty with no bounds', () => {
    expect(render(buildSavedDateClause(col)).sql).toBe('')
  })

  it('uses BETWEEN when both bounds are present', () => {
    const out = render(buildSavedDateClause(col, '2026-07-01', '2026-07-31'))
    expect(out.sql).toContain('BETWEEN ? AND ?')
    expect(out.params).toEqual(['2026-07-01', '2026-07-31'])
  })

  it('uses >= with only a start bound', () => {
    const out = render(buildSavedDateClause(col, '2026-07-01'))
    expect(out.sql).toContain('>= ?')
    expect(out.params).toEqual(['2026-07-01'])
  })

  it('uses <= with only an end bound', () => {
    const out = render(buildSavedDateClause(col, undefined, '2026-07-31'))
    expect(out.sql).toContain('<= ?')
    expect(out.params).toEqual(['2026-07-31'])
  })
})
