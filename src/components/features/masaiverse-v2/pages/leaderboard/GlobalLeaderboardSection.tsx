import { useQuery } from '@tanstack/react-query'
import {
  getAvatarPalette,
  getInitials,
  getRankMedal,
} from '../club/clubLeaderboardAvatar'
import type { GlobalLeaderboardEntry } from '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { masaiverseV2GlobalLeaderboardQuery } from '@/query/masaiverse-v2/leaderboardQuery'

/** Show a full board on the dedicated page (server clamps to its max of 50). */
const GLOBAL_LIMIT = 50

/**
 * The community-wide (global) leaderboard for the leaderboard page — every
 * member ranked by total all-time points, highest first.
 */
export default function GlobalLeaderboardSection() {
  const { data, isPending, isError } = useQuery(
    masaiverseV2GlobalLeaderboardQuery(GLOBAL_LIMIT),
  )
  const entries = data ?? []

  if (isPending) {
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

  if (isError) {
    return (
      <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
        We couldn&apos;t load the leaderboard. Please try again.
      </p>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
        No points have been earned yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <GlobalLeaderboardRow key={entry.userId} entry={entry} />
      ))}
    </div>
  )
}

function GlobalLeaderboardRow({ entry }: { entry: GlobalLeaderboardEntry }) {
  const medal = getRankMedal(entry.rank)
  const palette = getAvatarPalette(entry.userId)
  const isTop = entry.rank === 1

  return (
    <div
      className={`flex items-center gap-4 rounded-[16px] border p-4 ${
        isTop
          ? 'border-masaiverse-orange/40 bg-masaiverse-orange/5'
          : 'border-[#EDEAE8] bg-white'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-[16px] font-semibold text-[#6B7280]">
        {medal ?? entry.rank}
      </span>
      <Avatar size="lg" className="shrink-0">
        {entry.avatarUrl ? (
          <AvatarImage src={entry.avatarUrl} alt={entry.name} />
        ) : null}
        <AvatarFallback
          className="text-[14px] font-semibold"
          style={{ backgroundColor: palette.bg, color: palette.text }}
        >
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>
      <p className="min-w-0 flex-1 truncate text-[16px] font-bold leading-5 text-[#111827]">
        {entry.name}
      </p>
      <p className="shrink-0 text-[20px] font-extrabold text-masaiverse-orange">
        {entry.points.toLocaleString()}
        <span className="ml-1 text-[13px] font-medium text-[#6B7280]">pts</span>
      </p>
    </div>
  )
}
