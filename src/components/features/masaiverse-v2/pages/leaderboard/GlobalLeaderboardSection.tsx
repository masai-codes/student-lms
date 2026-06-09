import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import LeaderboardList from './LeaderboardList'
import LeaderboardPeriodTabs from './LeaderboardPeriodTabs'
import type { LeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'
import { masaiverseV2GlobalLeaderboardQuery } from '@/query/masaiverse-v2/leaderboardQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

/** Top 10; the server also pins the viewer's own row when they fall below it. */
const GLOBAL_LIMIT = 10

/**
 * The community-wide (global) leaderboard — the top members by total points,
 * for the whole community, with an Overall / This month toggle and the
 * signed-in member's own placement pinned in.
 */
export default function GlobalLeaderboardSection() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('overall')
  const { data, isPending, isError } = useQuery(
    masaiverseV2GlobalLeaderboardQuery(period, GLOBAL_LIMIT),
  )

  return (
    <div className="flex flex-col gap-4">
      <LeaderboardPeriodTabs
        value={period}
        onChange={(next) => {
          trackMasaiverse(MASAIVERSE_EVENTS.leaderboardPeriodChange, {
            period: next,
            scope: 'global',
          })
          setPeriod(next)
        }}
      />
      {isPending ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
          We couldn&apos;t load the leaderboard. Please try again.
        </p>
      ) : data.entries.length === 0 ? (
        <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
          No points have been earned yet.
        </p>
      ) : (
        <LeaderboardList entries={data.entries} currentUser={data.currentUser} />
      )}
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Loading leaderboard"
    >
      {[0, 1, 2, 3, 4].map((key) => (
        <div
          key={key}
          className="h-[72px] animate-pulse rounded-[16px] bg-[#ECE7E2]"
        />
      ))}
      <span className="sr-only">Loading leaderboard…</span>
    </div>
  )
}
