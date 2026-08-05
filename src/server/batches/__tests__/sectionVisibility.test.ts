import { describe, expect, it } from 'vitest'
import { MySqlDialect } from 'drizzle-orm/mysql-core'

import { sectionNotHiddenCondition } from '../sectionVisibility'

const dialect = new MySqlDialect()

describe('sectionNotHiddenCondition', () => {
  it('compares settings.hideSection against a JSON true', () => {
    const { sql } = dialect.sqlToQuery(sectionNotHiddenCondition())
    const flat = sql.replace(/\s+/g, ' ')

    expect(flat).toContain('`sections`.`settings`')
    expect(flat).toContain(`'$.hideSection'`)
    expect(flat).toContain(`CAST('true' AS JSON)`)
  })

  it('keeps rows whose settings JSON has no hideSection key', () => {
    const { sql } = dialect.sqlToQuery(sectionNotHiddenCondition())
    const flat = sql.replace(/\s+/g, ' ')

    // JSON_EXTRACT returns SQL NULL for a missing key, so the comparison is
    // NULL — COALESCE(..., FALSE) is what makes such a section visible.
    expect(flat).toContain('NOT COALESCE(')
    expect(flat).toContain('FALSE')
  })
})
