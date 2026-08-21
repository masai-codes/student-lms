import { describe, expect, it } from 'vitest'
import { MySqlDialect } from 'drizzle-orm/mysql-core'

import { sectionNotHiddenCondition } from '../sectionVisibility'

const dialect = new MySqlDialect()

function renderForIITJ(): string {
  const condition = sectionNotHiddenCondition('iitj')
  expect(condition).toBeDefined()
  return dialect.sqlToQuery(condition!).sql.replace(/\s+/g, ' ')
}

describe('sectionNotHiddenCondition', () => {
  it('compares settings.hideSection against a JSON true on the IITJ portal', () => {
    const flat = renderForIITJ()

    expect(flat).toContain('`sections`.`settings`')
    expect(flat).toContain(`'$.hideSection'`)
    expect(flat).toContain(`CAST('true' AS JSON)`)
  })

  it('keeps rows whose settings JSON has no hideSection key', () => {
    const flat = renderForIITJ()

    // JSON_EXTRACT returns SQL NULL for a missing key, so the comparison is
    // NULL — COALESCE(..., FALSE) is what makes such a section visible.
    expect(flat).toContain('NOT COALESCE(')
    expect(flat).toContain('FALSE')
  })

  it('is a no-op on the Masai and iHub portals', () => {
    expect(sectionNotHiddenCondition('masai')).toBeUndefined()
    expect(sectionNotHiddenCondition('ihub')).toBeUndefined()
  })
})
