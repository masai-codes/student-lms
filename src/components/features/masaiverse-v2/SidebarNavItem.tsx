import { Link } from '@tanstack/react-router'
import type { Icon } from '@phosphor-icons/react'
import type { MasaiverseV2NavPath } from './data/sidebarNavItems'
import { MASAIVERSE_EVENTS, trackMasaiverse } from './tracking'

type SidebarNavItemProps = {
  label: string
  icon: Icon
  to: MasaiverseV2NavPath
  isActive?: boolean
  badgeCount?: number
}

export default function SidebarNavItem({
  label,
  icon: IconComponent,
  to,
  isActive = false,
  badgeCount,
}: SidebarNavItemProps) {
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0

  return (
    <Link
      to={to}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.navClick, {
          item: label,
          surface: 'sidebar',
          to,
        })
      }
      className={`flex items-center gap-2.5 rounded-[10px] px-4 py-[10px] ${
        isActive ? 'bg-accent-warm' : 'hover:bg-surface-muted'
      }`}
    >
      <IconComponent
        size={20}
        weight={isActive ? 'fill' : 'regular'}
        color={isActive ? 'var(--accent-warm-foreground)' : 'var(--foreground)'}
      />
      <span
        className={`flex-1 text-[14px] font-medium leading-5 ${
          isActive ? 'text-accent-warm-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </span>
      {showBadge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-warm px-1.5 text-[12px] font-semibold leading-none text-accent-warm-foreground">
          {badgeCount}
        </span>
      ) : null}
    </Link>
  )
}
