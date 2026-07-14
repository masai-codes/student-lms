import { redis } from '@/server/redis/client'

/**
 * Redis distributed lock — the "single key on a hook" shared across PM2 workers.
 *
 * `acquireLock` does an atomic `SET key <val> EX <ttl> NX`: it succeeds only if
 * the key is currently free, so no two workers can both hold it. The TTL is a
 * safety net — if a holder crashes without releasing, the lock auto-frees after
 * `ttlSeconds` instead of wedging forever.
 *
 * Degradation: when Redis is disabled OR unreachable, `acquireLock` returns
 * `true` (treats the lock as granted). Callers must therefore keep their own
 * secondary guard (e.g. the DB idempotency check in createAssessPlatformUrl) so
 * correctness never depends on Redis being up — the lock only removes the
 * duplicate *work*, not the duplicate-safety.
 */

/** Try to grab `key` for up to `ttlSeconds`. Returns whether we got it. */
export async function acquireLock(
  key: string,
  ttlSeconds: number,
): Promise<boolean> {
  if (!redis) return true // no shared lock available → let the caller's own guard handle it
  try {
    const res = await redis.set(key, '1', 'EX', Math.max(1, ttlSeconds), 'NX')
    return res === 'OK'
  } catch {
    // Redis down mid-request: don't block the user, fall through to the caller's guard.
    return true
  }
}

/** Release a lock we hold. Safe to call even if we never acquired it. */
export async function releaseLock(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    /* TTL will expire the lock anyway */
  }
}
