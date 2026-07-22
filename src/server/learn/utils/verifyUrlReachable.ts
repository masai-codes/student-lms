const REACHABILITY_CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 4_000

type CacheEntry = { ok: boolean; expiresAt: number }

const reachabilityCache = new Map<string, CacheEntry>()

async function probeUrl(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    })

    if (headResponse.ok) return true

    if (headResponse.status !== 405 && headResponse.status !== 403) {
      return false
    }

    const getResponse = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })

    return getResponse.ok || getResponse.status === 206
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

/** HEAD (with GET Range fallback) to confirm a CDN URL is reachable. Cached per URL. */
export async function verifyUrlReachable(url: string): Promise<boolean> {
  const trimmed = url.trim()
  if (!trimmed) return false

  const cached = reachabilityCache.get(trimmed)
  if (cached != null && cached.expiresAt > Date.now()) {
    return cached.ok
  }

  const ok = await probeUrl(trimmed)
  reachabilityCache.set(trimmed, {
    ok,
    expiresAt: Date.now() + REACHABILITY_CACHE_TTL_MS,
  })
  return ok
}

/** Test helper — clears the in-memory reachability cache. */
export function clearUrlReachabilityCacheForTests(): void {
  reachabilityCache.clear()
}
