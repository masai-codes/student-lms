import { redis } from '@/server/redis/client'

/**
 * Thin, null-safe JSON cache helpers over the shared Redis client.
 *
 * Every function is a no-op / miss when Redis is disabled or unreachable, and
 * NEVER throws — callers always fall back to computing from the DB. This is the
 * "shared whiteboard": a value written here is visible to every PM2 worker,
 * unlike per-process memoisation.
 */

let warned = false
function warnOnce(context: string, err: unknown): void {
  if (!warned) {
    console.warn(`[redis] ${context} failed, degrading to DB:`, err)
    warned = true
  }
}

/** Read + JSON-parse a key. Returns null on miss, disabled, or any error. */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch (err) {
    warnOnce('cacheGetJson', err)
    return null
  }
}

/** JSON-stringify + write a key with a TTL (seconds). No-op when disabled. */
export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return
  try {
    await redis.set(
      key,
      JSON.stringify(value),
      'EX',
      Math.max(1, Math.floor(ttlSeconds)),
    )
  } catch (err) {
    warnOnce('cacheSetJson', err)
  }
}

/** Delete one or more keys. No-op when disabled. */
export async function cacheDel(...keys: Array<string>): Promise<void> {
  if (!redis || keys.length === 0) return
  try {
    await redis.del(...keys)
  } catch (err) {
    warnOnce('cacheDel', err)
  }
}
