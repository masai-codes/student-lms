import type { ComponentType } from 'react'

type NavItemUiType = 'primary' | 'secondary' | 'tertiary'

type NavItemBase = {
  id: string
  icon?: ComponentType<{ className?: string }>
  label?: string
  uiType: NavItemUiType
  /** Required for icon-only render (secondary items with no visible label). */
  tooltip?: string
  /**
   * Default true. Set false to force icon-only rendering even when this item
   * is resolved as the primary (e.g. Refer & Earn stays icon-only once
   * "Get the app" has claimed the primary slot).
   */
  showTextWhenPrimary?: boolean
  /**
   * The item declares its own active state (e.g. comparing `to` against the
   * current pathname) — there is no shared centralized pathname→id resolver.
   */
  isActive?: boolean
  /** Notification badge count (e.g. unread announcements). */
  notificationCount?: number
}

export type NavItem =
  | (NavItemBase & { type: 'internal-link'; to: string })
  | (NavItemBase & { type: 'external-link'; href: string })
  | (NavItemBase & { type: 'action'; onClick: () => void })
