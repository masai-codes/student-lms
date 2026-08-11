import './utils/loadEnv'

import { sql } from 'drizzle-orm'

import { db } from '@/db'

import { assertLocalSeedDatabase } from './utils/assertLocalSeedDatabase'
import { PRESERVED_TABLES } from './utils/constants'

type SchemaRow = { TABLE_NAME: string }

function normalizeRows(result: unknown): Array<SchemaRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<SchemaRow>
    return result as Array<SchemaRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as Record<string, unknown>).rows)
  ) {
    return (result as { rows: Array<SchemaRow> }).rows
  }
  return []
}

/**
 * Truncates all app-data tables in the connected database, preserving migration
 * metadata. Guarded solely by the localhost check in `assertLocalSeedDatabase` —
 * a non-local DATABASE_URL is the thing that makes a reset dangerous, and
 * NODE_ENV says nothing about which database is connected.
 */
export async function resetDatabase(): Promise<{ truncatedTables: string[] }> {
  assertLocalSeedDatabase()

  const result = await db.execute(sql`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
  `)

  const tableNames = normalizeRows(result)
    .map((row) => row.TABLE_NAME)
    .filter(
      (name) =>
        !PRESERVED_TABLES.includes(name as (typeof PRESERVED_TABLES)[number]),
    )
    .sort()

  if (tableNames.length === 0) {
    return { truncatedTables: [] }
  }

  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 0'))

  try {
    for (const tableName of tableNames) {
      await db.execute(sql.raw(`TRUNCATE TABLE \`${tableName}\``))
    }
  } finally {
    await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 1'))
  }

  return { truncatedTables: tableNames }
}
