import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import LeaderboardList from '../leaderboard/LeaderboardList'
import LeaderboardPeriodTabs from '../leaderboard/LeaderboardPeriodTabs'
import type { ClubLeaderboardResult } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'
import type { LeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'
import { masaiverseV2ClubLeaderboardQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type ClubLeaderboardSectionProps = {
  clubId: string
  /**
   * Top members embedded in the club detail payload; seeds the Overall tab so
   * the section renders without an extra request. Other periods fetch on demand.
   */
  initialLeaderboard?: ClubLeaderboardResult
}

/**
 * Club detail leaderboard — the club's top members by their club-scoped points,
 * with an Overall / This month toggle and the viewer's own placement pinned in.
 */
export default function ClubLeaderboardSection({
  clubId,
  initialLeaderboard,
}: ClubLeaderboardSectionProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('overall')
  const { data, isPending, isError } = useQuery({
    ...masaiverseV2ClubLeaderboardQuery(clubId, period),
    ...(period === 'overall' && initialLeaderboard
      ? { initialData: initialLeaderboard }
      : {}),
  })

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[22px] font-extrabold leading-7 text-foreground">
        Club Leaderboard
      </h2>
      <LeaderboardPeriodTabs
        value={period}
        onChange={(next) => {
          trackMasaiverse(MASAIVERSE_EVENTS.leaderboardPeriodChange, {
            period: next,
            scope: 'club',
            club_id: clubId,
          })
          setPeriod(next)
        }}
      />
      {isPending ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <p className="rounded-[16px] border border-border bg-surface p-6 text-[14px] text-foreground-muted">
          We couldn&apos;t load the leaderboard. Please try again.
        </p>
      ) : data.entries.length === 0 ? (
        <p className="rounded-[16px] border border-border bg-surface p-6 text-[14px] text-foreground-muted">
          No points have been earned in this club yet.
        </p>
      ) : (
        <LeaderboardList
          entries={data.entries}
          currentUser={data.currentUser}
        />
      )}
    </section>
  )
}

function LeaderboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Loading leaderboard"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[72px] animate-pulse rounded-[16px] bg-surface-muted"
        />
      ))}
      <span className="sr-only">Loading leaderboard…</span>
    </div>
  )
}
