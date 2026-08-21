import { describe, expect, it } from 'vitest'
import { MySqlDialect } from 'drizzle-orm/mysql-core'

import { buildAbsentWindowOverCondition } from '@/server/learn/utils/buildAbsentWindowOverCondition'

const dialect = new MySqlDialect()
// 2026-06-22 12:00 UTC → +5:30 IST = 2026-06-22 17:30:00 (IST wall-clock).
const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)

function render() {
  return dialect.sqlToQuery(buildAbsentWindowOverCondition(NOW_MS))
}

describe('buildAbsentWindowOverCondition', () => {
  it('emits a correlated EXISTS over sections tied to the lecture', () => {
    const { sql } = render()
    expect(sql).toContain('EXISTS')
    expect(sql).toContain('`sections`')
    expect(sql).toContain('`sections`.`id` = `lectures`.`section_id`')
  })

  it('requires the section to count recording watch-time', () => {
    const { sql } = render()
    expect(sql).toContain("'$.enableVideoAttendance'")
    expect(sql).toContain("'$.considerVideoAttendanceForActualAttendance'")
  })

  it('requires a positive catch-up window and that it has closed', () => {
    const { sql } = render()
    expect(sql).toContain("'$.catchUpDays'")
    expect(sql).toContain('> 0')
    expect(sql).toContain('DATE_ADD')
    expect(sql).toContain(
      'COALESCE(`lectures`.`concludes`, `lectures`.`schedule`)',
    )
    expect(sql).toContain('<=')
  })

  it('compares against now shifted into IST wall-clock', () => {
    const { params } = render()
    // toMysqlUtc(NOW_MS + 5:30) → "2026-06-22 17:30:00"
    expect(params).toContain('2026-06-22 17:30:00')
  })
})
