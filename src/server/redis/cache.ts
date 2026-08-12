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

/** Collect every key matching a glob pattern via a non-blocking SCAN. */
export async function cacheScanKeys(pattern: string): Promise<Array<string>> {
  if (!redis) return []
  try {
    const found: Array<string> = []
    const stream = redis.scanStream({ match: pattern, count: 200 })
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: Array<string>) => {
        for (const key of keys) found.push(key)
      })
      stream.on('end', () => resolve())
      stream.on('error', (err: Error) => reject(err))
    })
    return found
  } catch (err) {
    warnOnce('cacheScanKeys', err)
    return []
  }
}

/** SCAN + pipelined delete of every key matching a glob pattern. */
async function cacheDelByPattern(pattern: string): Promise<void> {
  const keys = await cacheScanKeys(pattern)
  await cacheDel(...keys)
}
