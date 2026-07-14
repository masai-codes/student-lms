import LeaderboardRow from './LeaderboardRow'
import type { LeaderboardRowEntry } from './LeaderboardRow'

/**
 * The top members followed by the signed-in member's own row. When the viewer
 * already sits in the top list their row is just highlighted in place;
 * otherwise it is pinned below a separator so they can see where they land.
 */
export default function LeaderboardList({
  entries,
  currentUser,
}: {
  entries: Array<LeaderboardRowEntry>
  currentUser: LeaderboardRowEntry | null
}) {
  const isInTop =
    currentUser != null && entries.some((e) => e.userId === currentUser.userId)
  const pinnedCurrentUser = currentUser != null && !isInTop ? currentUser : null

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={currentUser?.userId === entry.userId}
        />
      ))}
      {pinnedCurrentUser ? (
        <>
          <p
            className="text-center text-[18px] leading-none text-foreground-subtle"
            aria-hidden
          >
            ···
          </p>
          <LeaderboardRow entry={pinnedCurrentUser} isCurrentUser />
        </>
      ) : null}
    </div>
  )
}
