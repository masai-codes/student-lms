import { PGlite } from '@electric-sql/pglite'

import { fetchTemplateBytes, isBinarySqliteFile } from './templateFile'
import type { ColumnInfo, EditorEngine, ResultSet, TableSchema } from './types'

async function loadSchema(db: PGlite): Promise<TableSchema[]> {
  const tables = await db.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  )

  const schemas: TableSchema[] = []
  for (const { table_name } of tables.rows) {
    const cols = await db.query<{
      column_name: string
      data_type: string
      is_nullable: string
      is_pk: boolean
    }>(
      `SELECT c.column_name, c.data_type, c.is_nullable,
              EXISTS (
                SELECT 1
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON kcu.constraint_name = tc.constraint_name
                 AND kcu.table_schema = tc.table_schema
                WHERE tc.table_schema = 'public'
                  AND tc.table_name = c.table_name
                  AND tc.constraint_type = 'PRIMARY KEY'
                  AND kcu.column_name = c.column_name
              ) AS is_pk
       FROM information_schema.columns c
       WHERE c.table_schema = 'public' AND c.table_name = $1
       ORDER BY c.ordinal_position`,
      [table_name],
    )
    const columns: ColumnInfo[] = cols.rows.map((c) => ({
      name: c.column_name,
      type: c.data_type,
      notNull: c.is_nullable === 'NO',
      isPrimaryKey: c.is_pk,
    }))
    const count = await db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM "${table_name}"`,
    )
    schemas.push({ name: table_name, rowCount: count.rows[0]?.n ?? 0, columns })
  }
  return schemas
}

/**
 * PGlite (Postgres) engine for a lecture's SQL playground tab, seeded from
 * the lecture's `.sql` template (a pg_dump-style script — a binary SQLite
 * file isn't a valid Postgres seed, so that case throws).
 */
export function createPgliteEngine(templateUrl: string): EditorEngine {
  let dbPromise: Promise<PGlite> | null = null

  function getDatabase(): Promise<PGlite> {
    if (!dbPromise) {
      const promise = (async () => {
        const bytes = await fetchTemplateBytes(templateUrl)
        if (isBinarySqliteFile(bytes)) {
          throw new Error(
            'The template is a binary SQLite database file — the PostgreSQL playground needs a .sql script (e.g. a pg_dump)',
          )
        }
        const db = new PGlite()
        await db.exec(new TextDecoder().decode(bytes))
        return db
      })()
      // Don't cache failures — reopening the tab retries.
      promise.catch(() => {
        if (dbPromise === promise) dbPromise = null
      })
      dbPromise = promise
    }
    return dbPromise
  }

  return {
    async init() {
      await getDatabase()
    },
    async exec(sql: string): Promise<ResultSet[]> {
      const db = await getDatabase()
      const results = await db.exec(sql)
      return results
        .filter((r) => r.fields.length > 0)
        .map((r) => ({
          columns: r.fields.map((f) => f.name),
          values: r.rows.map((row) =>
            r.fields.map((f) => (row as Record<string, unknown>)[f.name]),
          ),
        }))
    },
    async schema() {
      const db = await getDatabase()
      return loadSchema(db)
    },
  }
}
