import type { MouseEventHandler, ReactNode } from 'react'

/** Hover + active text/icon color for primary nav and profile menu (keep Tailwind `text-[#6962AC]` in sync). */
const NAVBAR_ACCENT_HEX = '#6962AC' as const

type NavbarHref = string

/**
 * Every navbar entry renders an anchor, so it must be actionable one of two ways:
 * navigate via `href`, or run an `onClick` handler (button-like items that open a
 * modal or trigger a flow instead of linking). Requiring at least one of the two
 * keeps inert anchors out of the navbar.
 */
type NavbarActivation =
  | {
      href: NavbarHref
      /** When omitted, `http(s)://` URLs open in a new tab; app paths stay in the same tab. */
      openInNewTab?: boolean
      /**
       * Fires on the anchor click before navigation. Call `event.preventDefault()` to handle
       * routing or actions yourself (e.g. Next.js `router.push`).
       */
      onClick?: MouseEventHandler<HTMLAnchorElement>
    }
  | {
      /** Handler-only item: no destination, so `openInNewTab` is meaningless. */
      href?: undefined
      openInNewTab?: undefined
      onClick: MouseEventHandler<HTMLAnchorElement>
    }

export type NavbarLinkItem = {
  id?: string
  label: string
  /** Optional leading icon (Tier 1 left-side items — Home, Learn, Chat, MasaiVerse, Interviews). */
  icon?: ReactNode
  /**
   * Mark the current route (or logical section). Renders accent color and an underline;
   * set from the consuming app (e.g. compare `pathname` to `href`).
   */
  isActive?: boolean
} & NavbarActivation

export type NavbarLogo = {
  src: string
  /** Optional variant shown in dark themes (swapped via CSS, no flash). */
  darkSrc?: string
  alt: string
  href: NavbarHref
  openInNewTab?: boolean
  /** Same as link items: optional handler on the logo anchor (e.g. `preventDefault` + client routing). */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type NavbarProfileMenuItem = NavbarLinkItem & {
  /** Leading icon next to the label (treat as decorative when `label` is set). */
  icon?: ReactNode
}

export type NavbarProfile = {
  avatarSrc?: string
  avatarAlt?: string
  /** Shown when there is no `avatarSrc` (typically initials). */
  fallbackText?: string
  menuItems: NavbarProfileMenuItem[]
  /** Accessible name for the profile menu trigger. */
  menuTriggerLabel?: string
}

type NavbarTextAction = {
  id?: string
  type: 'text'
  label: string
  /**
   * `plain` (default) renders a bare text link. `pill` renders a bordered,
   * rounded button with the optional leading `icon`.
   */
  variant?: 'plain' | 'pill'
  /** Leading icon shown next to the label. */
  icon?: ReactNode
  /** Mark the current route — renders the same active accent as primary nav items. */
  isActive?: boolean
} & NavbarActivation

type NavbarIconAction = {
  id?: string
  type: 'icon'
  icon: ReactNode
  ariaLabel: string
  /** Shown as the native browser tooltip on hover (e.g. "Calendar"). */
  tooltip?: string
  /**
   * Optional unread / notification count. When greater than zero, a red pill is shown on the icon
   * (values above 9 display as `9+`).
   */
  notificationCount?: number
  /** Mark the current route — renders the same active accent as primary nav items. */
  isActive?: boolean
} & NavbarActivation

type NavbarImageAction = {
  id?: string
  type: 'image'
  src: string
  alt: string
  /** Optional classes for the `<img>` (size, object-fit, etc.). */
  imageClassName?: string
  /** Native tooltip on hover (e.g. "Download app"). */
  tooltip?: string
} & NavbarActivation

/** Icon + visible label side by side (e.g. "Calendar", "Get started"). */
type NavbarIconTextAction = {
  id?: string
  type: 'iconText'
  icon: ReactNode
  label: string
  tooltip?: string
  /** Mark the current route — renders the same active accent as primary nav items. */
  isActive?: boolean
} & NavbarActivation

/** Non-interactive vertical divider between two action groups. */
type NavbarDividerAction = {
  id?: string
  type: 'divider'
}

export type NavbarActionItem =
  | NavbarTextAction
  | NavbarIconAction
  | NavbarImageAction
  | NavbarIconTextAction
  | NavbarDividerAction

export type NavbarProps = {
  logo: NavbarLogo
  navItems: NavbarLinkItem[]
  profile: NavbarProfile
  /**
   * Icon/text cluster rendered on the right of row 2 (the nav row), after the
   * primary nav links: announcements, calendar, chat, guided tour.
   */
  trailingActions?: NavbarActionItem[]
  /**
   * Actions rendered on the right of row 1 (the identity row), next to the CTA
   * and the profile control — e.g. the "Get the app" pill.
   */
  primaryRowActions?: NavbarActionItem[]
  /**
   * Text links pinned to the far right of row 1, after the icon cluster
   * (Refer & Earn).
   */
  secondaryRowLinks?: NavbarActionItem[]
  upNext?: ReactNode
  /**
   * Tier 2: contextual per-module sub-nav rendered as a second row below row 1
   * (e.g. Learn's Discussions/Bookmarks, Community's MasaiVerse/Chat). Omit
   * entirely to hide the row — modules with no sub-nav (Home, Interviews)
   * render nothing here rather than an empty bar.
   */
  tier2?: ReactNode
  /** Primary CTA in row 1, before the profile control (the "Try New" pill). */
  actionsSlot?: ReactNode
  className?: string
  /**
   * Force the navbar to render in dark mode regardless of the active theme.
   * Stamps the `dark` theme token block + `.dark` onto the navbar's
   * own `<header>`, so only this subtree flips dark (the rest of the page keeps
   * the user's theme). Used on immersive pages like lecture detail.
   */
  forceDark?: boolean
}
