import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

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

    // --- Surviving an RDS reboot / failover ---------------------------------
    // A reboot silently kills every socket in the pool. Without the settings
    // below, those dead sockets sit here looking healthy until some request
    // borrows one and fails. These bound that window.

    // Probe idle sockets after 10s instead of inheriting the Linux default
    // (tcp_keepalive_time = 7200s). This is what actually lets the kernel tear
    // down connections killed by a reboot, so the pool replaces them in the
    // background rather than handing a corpse to the next request.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

    // Recycle idle connections so a stale one can't linger indefinitely.
    // maxIdle < connectionLimit means the pool keeps a small warm set and lets
    // the rest expire — also reduces idle connection count against RDS when
    // running under PM2 cluster mode (the limit above is *per worker*).
    maxIdle: 5,
    idleTimeout: 60_000,

    // Fail fast while the instance is still coming back up instead of holding
    // the request open; the caller retries against a healthy connection.
    connectTimeout: 10_000,
  })

globalForDb.__dbPool = pool

export const db = drizzle(pool, {
  logger: false,
})
