import type { MouseEventHandler, ReactNode } from 'react'

/** Hover + active text/icon color for primary nav and profile menu (keep Tailwind `text-[#6962AC]` in sync). */
export const NAVBAR_ACCENT_HEX = '#6962AC' as const

export type NavbarHref = string

/**
 * Every navbar entry renders an anchor, so it must be actionable one of two ways:
 * navigate via `href`, or run an `onClick` handler (button-like items that open a
 * modal or trigger a flow instead of linking). Requiring at least one of the two
 * keeps inert anchors out of the navbar.
 */
export type NavbarActivation =
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

export type NavbarTextAction = {
  id?: string
  type: 'text'
  label: string
} & NavbarActivation

export type NavbarIconAction = {
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
} & NavbarActivation

export type NavbarImageAction = {
  id?: string
  type: 'image'
  src: string
  alt: string
  /** Optional classes for the `<img>` (size, object-fit, etc.). */
  imageClassName?: string
  /** Native tooltip on hover (e.g. "Download app"). */
  tooltip?: string
} & NavbarActivation

export type NavbarActionItem =
  NavbarTextAction | NavbarIconAction | NavbarImageAction

export type NavbarProps = {
  logo: NavbarLogo
  navItems: NavbarLinkItem[]
  profile: NavbarProfile
  /** Shown to the left of the profile control (text links and/or icon buttons). */
  trailingActions?: NavbarActionItem[]
  /** Optional content rendered between nav items and trailing actions. */
  centerSlot?: ReactNode
  /** Optional content rendered in the trailing action row, before the theme switcher. */
  actionsSlot?: ReactNode
  className?: string
  /**
   * Force the navbar to render in dark mode regardless of the active theme.
   * Stamps the `midnight` dark-theme token block + `.dark` onto the navbar's
   * own `<header>`, so only this subtree flips dark (the rest of the page keeps
   * the user's theme). Used on immersive pages like lecture detail.
   */
  forceDark?: boolean
}
