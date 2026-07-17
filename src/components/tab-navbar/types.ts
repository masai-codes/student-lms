import type { MouseEventHandler, ReactNode } from 'react'

export type TabNavbarItem = {
  id?: string
  label: string
  icon: ReactNode
  /**
   * Mark the current section (parent-controlled), same idea as `NavbarLinkItem.isActive`.
   */
  isActive?: boolean
  /**
   * Render this tab as a brand action: the icon sits inside a raised, circular
   * Masai indigo gradient badge with an indigo label, so a special action like
   * "Back to Masai" stands out from the plain navigation tabs.
   */
  accent?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export type TabNavbarProps = {
  items: TabNavbarItem[]
  /**
   * Merged onto the root `<nav>`. Use for elevation when fixed to the bottom (e.g. `shadow-sm`,
   * `shadow-[0_-4px_24px_rgba(0,0,0,0.08)]`), rounding, or background overrides — no border is applied by default.
   */
  className?: string
  /**
   * Classes for every tab label (`<span>` under the icon). Defaults include size/weight/leading;
   * pass e.g. `text-sm font-semibold` to restyle all labels at once.
   */
  labelClassName?: string
  /**
   * Text/icon color applied to the active tab. Defaults to the Masai indigo
   * (`text-[#6962AC]`); pass e.g. `text-masaiverse-orange` to theme the active
   * tab for Masaiverse.
   */
  activeClassName?: string
  /** Passed to the wrapping `<nav>` for screen readers. */
  ariaLabel?: string
}
