import type { MouseEventHandler, ReactNode } from "react"

export type NavbarHref = string

export type NavbarLinkItem = {
  id?: string
  label: string
  href: NavbarHref
  /** When omitted, `http(s)://` URLs open in a new tab; app paths stay in the same tab. */
  openInNewTab?: boolean
  /**
   * Fires on the anchor click before navigation. Call `event.preventDefault()` to handle
   * routing or actions yourself (e.g. Next.js `router.push`).
   */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type NavbarLogo = {
  src: string
  alt: string
  href: NavbarHref
  openInNewTab?: boolean
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
  type: "text"
  label: string
  href: NavbarHref
  openInNewTab?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type NavbarIconAction = {
  id?: string
  type: "icon"
  icon: ReactNode
  ariaLabel: string
  href: NavbarHref
  openInNewTab?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type NavbarImageAction = {
  id?: string
  type: "image"
  src: string
  alt: string
  href: NavbarHref
  openInNewTab?: boolean
  /** Optional classes for the `<img>` (size, object-fit, etc.). */
  imageClassName?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type NavbarActionItem = NavbarTextAction | NavbarIconAction | NavbarImageAction

export type NavbarProps = {
  logo: NavbarLogo
  navItems: NavbarLinkItem[]
  profile: NavbarProfile
  /** Shown to the left of the profile control (text links and/or icon buttons). */
  trailingActions?: NavbarActionItem[]
  className?: string
}
