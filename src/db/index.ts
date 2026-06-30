import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

const isProduction = process.env.NODE_ENV === 'production'

// Cache the pool on globalThis so that hot-reloads (dev) and any accidental
// re-evaluation of this module (prod) reuse a single pool instead of opening a
// brand-new one each time. Without this, MySQL eventually hits
// `max_connections` (ER_CON_COUNT_ERROR / errno 1040).
const globalForDb = globalThis as unknown as { __dbPool?: mysql.Pool }

const pool =
  globalForDb.__dbPool ??
  mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10, // keep well under MySQL's max_connections
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
  })

globalForDb.__dbPool = pool

export const db = drizzle(pool, {
  logger: false,
})
