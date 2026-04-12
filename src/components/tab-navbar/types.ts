import type { MouseEventHandler, ReactNode } from "react"

export type TabNavbarItem = {
  id?: string
  label: string
  icon: ReactNode
  /**
   * Mark the current section (parent-controlled), same idea as `NavbarLinkItem.isActive`.
   */
  isActive?: boolean
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
  /** Passed to the wrapping `<nav>` for screen readers. */
  ariaLabel?: string
}
