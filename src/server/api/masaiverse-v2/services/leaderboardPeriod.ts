import { gte } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { masaiverseLeaderboard } from '@/db/schema'

/**
 * Which slice of points a leaderboard ranks:
 * - `overall` — every point ever earned.
 * - `month` — only points earned since the 1st of the current month.
 */
export type LeaderboardPeriod = 'overall' | 'month'

/** Parse the `?period=` query param, defaulting anything unknown to `overall`. */
export function parseLeaderboardPeriod(raw: string | null): LeaderboardPeriod {
  return raw === 'month' ? 'month' : 'overall'
}

/**
 * First instant of the current calendar month as a MySQL datetime string
 * (`YYYY-MM-DD 00:00:00`). Computed in the server's local time so it lines up
 * with the `NOW()`-defaulted `created_at` column.
 */
export function monthStart(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01 00:00:00`
}

/**
 * Drizzle condition restricting leaderboard rows to the given period, or
 * `undefined` for `overall` (no time filter). Safe to pass straight to
 * `.where()`, which ignores `undefined`.
 */
export function leaderboardPeriodCondition(
  period: LeaderboardPeriod,
  now = new Date(),
): SQL | undefined {
  return period === 'month'
    ? gte(masaiverseLeaderboard.createdAt, monthStart(now))
    : undefined
}
