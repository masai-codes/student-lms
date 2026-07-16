import { and, eq, isNull, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AnyMySqlColumn } from 'drizzle-orm/mysql-core'

/** Synthesized facet label for lectures/assignments with no stored `module`. */
const MODULE_WEEK_LABEL = /^Module (\d+)$/

/**
 * SQL predicate matching a resolved module label against the stored `module` column.
 *
 * Facet labels are `resolveModuleName(module, week)` — either the stored `module`,
 * or the synthesized `Module {week}` fallback. A selected `Module {week}` label must
 * therefore match rows where `module` is that literal OR where `module` is empty and
 * `week` equals N. Returns `undefined` when there is nothing to filter.
 */
export function buildModuleFilterCondition(
  moduleColumn: AnyMySqlColumn,
  weekColumn: AnyMySqlColumn,
  values: Array<string>,
): SQL | undefined {
  if (values.length === 0) {
    return undefined
  }

  const perValue = values.map((value) => {
    const match = MODULE_WEEK_LABEL.exec(value)
    if (match) {
      const week = Number(match[1])
      return or(
        eq(moduleColumn, value),
        and(
          or(isNull(moduleColumn), eq(moduleColumn, '')),
          eq(weekColumn, week),
        ),
      )
    }
    return eq(moduleColumn, value)
  })

  return perValue.length === 1 ? perValue[0] : or(...perValue)
}
