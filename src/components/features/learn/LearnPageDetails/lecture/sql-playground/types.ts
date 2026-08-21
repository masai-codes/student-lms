/** One result set from a query: column names plus row values. */
export interface ResultSet {
  columns: string[]
  values: unknown[][]
}

export interface ColumnInfo {
  name: string
  type: string
  notNull: boolean
  isPrimaryKey: boolean
}

export interface TableSchema {
  name: string
  rowCount: number
  columns: ColumnInfo[]
}

/** Engine backing the playground (sql.js/SQLite or PGlite/Postgres). */
export interface EditorEngine {
  /** Create or load the database; resolves when ready to run queries. */
  init: () => Promise<void>
  /** Execute SQL (possibly multiple statements); result sets for SELECTs. */
  exec: (sql: string) => Promise<ResultSet[]>
  /** Introspect current user tables. */
  schema: () => Promise<TableSchema[]>
}
