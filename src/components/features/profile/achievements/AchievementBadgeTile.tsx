import { Lock } from '@phosphor-icons/react'
import type { AchievementItem } from '@/server/api/profile/profile.types'

/**
 * One badge in the grid. Locked badges render dimmed and desaturated with a lock
 * overlay, so students can see what is still to earn.
 */
export function AchievementBadgeTile({
  item,
  index,
  onOpen,
}: {
  item: AchievementItem
  index: number
  onOpen: (item: AchievementItem) => void
}) {
  return (
    <button
      type="button"
      data-testid="profile-achievement-badge"
      data-badge-config-id={item.badgeConfigId}
      data-locked={item.isLocked}
      aria-label={`${item.badge.title}${item.isLocked ? ' (locked)' : ''}`}
      style={
        {
          '--dash-delay': `${Math.min(index, 8) * 0.05}s`,
        } as React.CSSProperties
      }
      className="dash-lift animate-dash-row-in flex w-[104px] flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center transition-colors hover:border-brand"
      onClick={() => onOpen(item)}
    >
      <span className="relative">
        <img
          src={item.badge.image}
          alt=""
          aria-hidden
          className={`size-16 object-contain transition-transform duration-200 ${
            item.isLocked ? 'opacity-40 grayscale' : 'group-hover:scale-110'
          }`}
        />
        {item.isLocked ? (
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle"
          >
            <Lock size={12} weight="fill" />
          </span>
        ) : item.count > 1 ? (
          <span
            data-testid="profile-achievement-count"
            className="animate-dash-pop absolute -bottom-1 -right-1 rounded-full bg-brand px-1.5 py-0.5 type-caption text-brand-foreground"
          >
            x{item.count}
          </span>
        ) : null}
      </span>

      <span className="line-clamp-2 type-caption text-foreground">
        {item.badge.title}
      </span>
    </button>
  )
}
