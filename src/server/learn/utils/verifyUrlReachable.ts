const REACHABILITY_CACHE_TTL_MS = 10 * 60 * 1000
const DEFAULT_FETCH_TIMEOUT_MS = 4_000

type CacheEntry = { ok: boolean; expiresAt: number }

const reachabilityCache = new Map<string, CacheEntry>()
const inFlightProbes = new Map<string, Promise<boolean>>()

async function probeUrl(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

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

export type VerifyUrlReachableOptions = {
  /** Per-probe network timeout. Support snapshot uses a shorter budget. */
  timeoutMs?: number
}

/** HEAD (with GET Range fallback) to confirm a CDN URL is reachable. Cached per URL. */
export async function verifyUrlReachable(
  url: string,
  options?: VerifyUrlReachableOptions,
): Promise<boolean> {
  const trimmed = url.trim()
  if (!trimmed) return false

  const cached = reachabilityCache.get(trimmed)
  if (cached != null && cached.expiresAt > Date.now()) {
    return cached.ok
  }

  const inFlight = inFlightProbes.get(trimmed)
  if (inFlight != null) {
    return inFlight
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
  const probe = probeUrl(trimmed, timeoutMs).then((ok) => {
    reachabilityCache.set(trimmed, {
      ok,
      expiresAt: Date.now() + REACHABILITY_CACHE_TTL_MS,
    })
    inFlightProbes.delete(trimmed)
    return ok
  })

  inFlightProbes.set(trimmed, probe)
  return probe
}

/** Test helper — clears the in-memory reachability cache. */
function clearUrlReachabilityCacheForTests(): void {
  reachabilityCache.clear()
  inFlightProbes.clear()
}
