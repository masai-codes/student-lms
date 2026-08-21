import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'

import { fetchTemplateBytes, isBinarySqliteFile } from './templateFile'
import type { ColumnInfo, EditorEngine, TableSchema } from './types'

/**
 * Served from `public/sql-wasm.wasm` (a build-time copy of
 * `sql.js/dist/sql-wasm.wasm`) rather than imported via a `?url` specifier —
 * Vite's dev server 404s on the raw `node_modules/sql.js/dist/sql-wasm.wasm`
 * path even though the `?url` import itself resolves, and a `public/` asset
 * is served identically in dev and the production build either way.
 */
const WASM_URL = '/sql-wasm.wasm'

/** Introspect all user tables with their columns and row counts. */
function getSchema(db: Database): TableSchema[] {
  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  if (tables.length === 0) return []

  return tables[0].values.map((row) => {
    const name = String(row[0])
    const columns: ColumnInfo[] = db
      .exec(`PRAGMA table_info("${name}")`)[0]
      .values.map((col) => ({
        name: String(col[1]),
        type: String(col[2] ?? ''),
        notNull: Number(col[3]) === 1,
        isPrimaryKey: Number(col[5]) > 0,
      }))
    const rowCount = Number(
      db.exec(`SELECT COUNT(*) FROM "${name}"`)[0].values[0][0],
    )
    return { name, rowCount, columns }
  })
}

/**
 * sql.js (SQLite) engine for a lecture's SQL playground tab, seeded from the
 * lecture's `.sql` (or binary SQLite) template file. One `PGlite`-style
 * instance per tab mount — unlike zef-ivs's classroom drawer, this tab is
 * scoped to a single lecture for its whole lifetime, so there is no template
 * swap to react to.
 */
export function createSqljsEngine(templateUrl: string): EditorEngine {
  let dbPromise: Promise<Database> | null = null

  function getDatabase(): Promise<Database> {
    if (!dbPromise) {
      const promise = (async () => {
        const [SQL, bytes] = await Promise.all([
          initSqlJs({ locateFile: () => WASM_URL }),
          fetchTemplateBytes(templateUrl),
        ])
        if (isBinarySqliteFile(bytes)) {
          return new SQL.Database(bytes)
        }
        const db = new SQL.Database()
        db.run(new TextDecoder().decode(bytes))
        return db
      })()
      // Don't cache failures — reopening the tab retries the fetch.
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
    async exec(sql: string) {
      const db = await getDatabase()
      return db.exec(sql).map((r) => ({ columns: r.columns, values: r.values }))
    },
    async schema() {
      const db = await getDatabase()
      return getSchema(db)
    },
  }
}
