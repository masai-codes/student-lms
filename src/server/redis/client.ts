import Redis from 'ioredis'

/**
 * Single shared ioredis client for the whole app (caches + distributed locks).
 *
 * Opt-in: Redis is only wired up when `ENABLE_REDIS === 'true'`. When it is off
 * (the default — local dev, CI, and any env that hasn't provisioned Redis) this
 * module exports `null` and every helper in `./cache` / `./lock` degrades to a
 * no-op so callers transparently fall back to their existing DB paths. That
 * keeps Redis a pure optimisation, never a hard dependency.
 *
 * Notes:
 *  - `db: 1` matches experience-api. If you point at the SAME Redis instance as
 *    experience-api, keep the key prefixes distinct (we use our own) to avoid
 *    keyspace collisions.
 *  - `enableOfflineQueue: false` → commands fail fast instead of buffering when
 *    the connection is down, so a Redis outage surfaces as a caught error and we
 *    fall back to the DB rather than hanging the request.
 *  - Cached on globalThis like the DB pool, so dev hot-reloads / accidental
 *    re-evaluation reuse one connection instead of leaking sockets.
 */

const REDIS_ENABLED = process.env.ENABLE_REDIS === 'true'

type RedisGlobal = { __lmsRedis?: Redis | null }
const globalForRedis = globalThis as unknown as RedisGlobal

function createClient(): Redis | null {
  if (!REDIS_ENABLED) return null

  const client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    db: Number(process.env.REDIS_DB ?? 1),
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  })

  // Log the first error after each healthy period, but never let a connection
  // problem crash the process — the helpers treat a down client as "no cache".
  let warned = false
  client.on('error', (err: Error) => {
    if (!warned) {
      console.warn('[redis] unavailable, degrading to DB:', err.message)
      warned = true
    }
  })
  client.on('ready', () => {
    warned = false
  })
  client.on('connect', () => {
    // Never let the cache connection keep a short-lived process alive. The
    // build prerender step, seed scripts, and tests all evaluate this module;
    // an open (ref'd) socket would block them from exiting and hang the process.
    // unref lets Node exit when nothing else is pending — a no-op at runtime,
    // where the HTTP server keeps the process up on its own. Re-applied on every
    // (re)connect because ioredis makes a fresh socket each time.
    ;(client as unknown as { stream?: { unref?: () => void } }).stream?.unref?.()
  })

  void client.connect().catch(() => {
    /* handled by the 'error' listener above */
  })

  return client
}

export const redis: Redis | null = globalForRedis.__lmsRedis ?? createClient()
globalForRedis.__lmsRedis = redis

/** Whether a live, connected Redis client is available right now. */
export function isRedisReady(): boolean {
  return redis != null && redis.status === 'ready'
}
