import {
  getAvatarPalette,
  getInitials,
  getRankMedal,
} from './clubLeaderboardAvatar'
import type { ClubLeaderboardEntry } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type ClubLeaderboardRowProps = {
  entry: ClubLeaderboardEntry
}

/** A single ranked member on the club leaderboard. */
export default function ClubLeaderboardRow({ entry }: ClubLeaderboardRowProps) {
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-bold leading-5 text-[#111827]">
          {entry.name}
        </p>
        <p className="truncate text-[13px] leading-5 text-[#6B7280]">
          {entry.postsCount} projects · {entry.eventsCount} events
        </p>
      </div>
      <p className="shrink-0 text-[20px] font-extrabold text-masaiverse-orange">
        {entry.points.toLocaleString()}
        <span className="ml-1 text-[13px] font-medium text-[#6B7280]">pts</span>
      </p>
    </div>
  )
}
