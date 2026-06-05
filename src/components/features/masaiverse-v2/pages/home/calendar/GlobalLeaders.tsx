import { useQuery } from '@tanstack/react-query'
import { Trophy } from '@phosphor-icons/react'
import {
  getAvatarPalette,
  getInitials,
  getRankMedal,
} from '../../club/clubLeaderboardAvatar'
import type { GlobalLeaderboardEntry } from '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service'
import { masaiverseV2GlobalLeaderboardQuery } from '@/query/masaiverse-v2/leaderboardQuery'

/**
 * The calendar drawer's leaderboard — the community-wide (global) ranking by
 * total all-time points, not scoped to a month or club.
 */
export default function GlobalLeaders() {
  const { data, isPending } = useQuery(masaiverseV2GlobalLeaderboardQuery())
  const leaders = data ?? []

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <Trophy size={14} />
        Global leaderboard
      </p>
      {isPending ? (
        <div
          role="status"
          aria-label="Loading leaderboard"
          className="flex flex-col gap-3"
        >
          <span className="sr-only">Loading leaderboard…</span>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-8 animate-pulse rounded-[8px] bg-[#ECE7E2]"
            />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-[12px] text-[#9CA3AF]">No points earned yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {leaders.map((leader) => (
            <LeaderRow key={leader.userId} leader={leader} />
          ))}
        </div>
      )}
    </div>
  )
}

function LeaderRow({ leader }: { leader: GlobalLeaderboardEntry }) {
  const medal = getRankMedal(leader.rank)
  const palette = getAvatarPalette(leader.userId)

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-center text-[13px] leading-none">
        {medal ?? leader.rank}
      </span>
      <span
        className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[12px] font-semibold"
        style={{ backgroundColor: palette.bg, color: palette.text }}
      >
        {leader.avatarUrl ? (
          <img
            src={leader.avatarUrl}
            alt={leader.name}
            className="size-full object-cover"
          />
        ) : (
          getInitials(leader.name)
        )}
      </span>
      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-4 text-[#111827]">
        {leader.name}
      </p>
      <span className="text-[13px] font-bold text-masaiverse-orange">
        {leader.points.toLocaleString()}
      </span>
    </div>
  )
}
