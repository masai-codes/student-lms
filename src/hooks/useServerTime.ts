import { useQuery } from '@tanstack/react-query'
import { getAdjustedNow } from '@/utils/timeZoneHandler'
import { SERVER_TIME_API } from '@/lib/api/dashboardPaths'
import type { ServerTimeResult } from '@/server/api/serverTime/getServerTime.handler'
import type dayjs from 'dayjs'

const POLL_INTERVAL_MS = 5 * 60 * 1000
const STORAGE_KEY = 'lms-server-time-cache'

type CacheEntry = { serverTimeISO: string; fetchedAt: number }

function loadCache(): CacheEntry | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CacheEntry) : undefined
  } catch {
    return undefined
  }
}

function saveCache(entry: CacheEntry) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch { /* ignore */ }
}

async function fetchServerTime(): Promise<CacheEntry> {
  const res = await fetch(SERVER_TIME_API)
  if (!res.ok) throw new Error('Failed to fetch server time')
  const data = (await res.json()) as ServerTimeResult
  const entry: CacheEntry = { serverTimeISO: data.serverTime, fetchedAt: Date.now() }
  saveCache(entry)
  return entry
}

/**
 * Returns server-adjusted current time and skewMs.
 *
 * skewMs = serverUTC_ms − deviceUTC_ms at last fetch.
 * Positive when device clock is behind actual UTC.
 * Pass skewMs to format functions so displayed times match the user's device clock.
 *
 * Uses localStorage to seed an immediate value on load — eliminates the
 * "shows wrong time for 2 seconds then corrects" flash.
 */
export function useServerTime(): { now: dayjs.Dayjs; skewMs: number } {
  const { data } = useQuery({
    queryKey: ['server-time'],
    queryFn: fetchServerTime,
    initialData: loadCache,       // immediate value from last session
    initialDataUpdatedAt: 0,      // always treat as stale → always refetch on mount
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  })

  const now = data
    ? getAdjustedNow(data.serverTimeISO, data.fetchedAt)
    : getAdjustedNow(new Date().toISOString(), Date.now())

  const rawSkewMs = data
    ? new Date(data.serverTimeISO).getTime() - data.fetchedAt
    : 0
  // Round to nearest minute so sub-minute noise doesn't shift displayed times
  const skewMs = Math.round(rawSkewMs / 60_000) * 60_000

  return { now, skewMs }
}
