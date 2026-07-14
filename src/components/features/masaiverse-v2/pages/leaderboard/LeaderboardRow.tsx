import {
  getAvatarPalette,
  getInitials,
  getRankMedal,
} from '../club/clubLeaderboardAvatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/** The minimal shape a leaderboard row needs; both global and club entries fit. */
export interface LeaderboardRowEntry {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  points: number
}

/**
 * A single ranked member. The signed-in member's row is highlighted (and
 * labelled "You") wherever it appears — in the top list or pinned below it.
 */
export default function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: {
  entry: LeaderboardRowEntry
  isCurrentUser?: boolean
}) {
  const medal = getRankMedal(entry.rank)
  const palette = getAvatarPalette(entry.userId)

  return (
    <div
      className={`flex items-center gap-4 rounded-[16px] border p-4 ${
        isCurrentUser
          ? 'border-accent-warm bg-accent-warm/10 ring-1 ring-accent-warm/30'
          : entry.rank === 1
            ? 'border-accent-warm/40 bg-accent-warm/5'
            : 'border-border bg-surface'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-[16px] font-semibold text-foreground-muted">
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
      <p className="min-w-0 flex-1 truncate text-[16px] font-bold leading-5 text-foreground">
        {entry.name}
        {isCurrentUser ? (
          <span className="ml-2 text-[12px] font-semibold text-accent-warm">
            You
          </span>
        ) : null}
      </p>
      <p className="shrink-0 text-[20px] font-extrabold text-accent-warm">
        {entry.points.toLocaleString()}
        <span className="ml-1 text-[13px] font-medium text-foreground-muted">
          pts
        </span>
      </p>
    </div>
  )
}
