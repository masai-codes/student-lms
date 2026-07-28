'use client'

import { NavbarLogo } from './navbar-logo'
import { NavbarNavItems } from './navbar-nav-items'
import { NavbarProfileMenu } from './navbar-profile-menu'
import { NavbarTrailingActions } from './navbar-trailing-actions'
import type { NavbarProps } from './types'

import { LAYOUT_NAVBAR_INNER_CLASSES } from '@/lib/layout'
import { cn } from '@/lib/utils'
// import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'

/**
 * Dark theme applied to the navbar subtree when `forceDark` is set. Matches a
 * real `[data-theme='…']` block in `styles.css`; setting it on `<header>`
 * redefines the semantic tokens (surface/foreground/…) for just this subtree.
 */
const FORCE_DARK_THEME_ID = 'midnight'

export function Navbar({
  logo,
  navItems,
  profile,
  trailingActions,
  centerSlot,
  actionsSlot,
  className,
  forceDark,
}: NavbarProps) {
  return (
    <header
      data-app-navbar
      data-theme={forceDark ? FORCE_DARK_THEME_ID : undefined}
      className={cn(
        'sticky top-0 z-[210] flex w-full flex-col bg-surface shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] rounded-b-[32px] lg:px-6',
        // Forced-dark navbar sits over a light page, so the rounded bottom
        // corners would otherwise reveal the light page as white slivers. Keep
        // the rounded look but back the header with a square dark layer (the
        // midnight page background), so the corner cutouts show dark instead.
        forceDark &&
          'dark before:absolute before:inset-0 before:-z-10 before:rounded-b-none before:bg-background before:content-[""]',
        className,
      )}
    >
      <div
        className={cn(
          LAYOUT_NAVBAR_INNER_CLASSES,
          'justify-between py-3 lg:py-4',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4 xl:gap-8 2xl:gap-12">
          <NavbarLogo logo={logo} />
          <NavbarNavItems items={navItems} />
        </div>

        <div className="flex min-w-0 shrink items-center gap-2 xl:gap-4">
          {/* Only the center badge is allowed to shrink/truncate; the icon
              cluster, toggle, theme switcher and avatar stay a fixed size so
              they never overlap or wrap when the badge + toggle are both live. */}
          {centerSlot ? (
            <div className="flex min-w-0 shrink items-center">{centerSlot}</div>
          ) : null}
          <div className="flex shrink-0 items-center gap-2 xl:gap-4">
            <NavbarTrailingActions items={trailingActions ?? []} />
            {actionsSlot ?? null}
            {/* <ThemeSwitcher /> */}
            <NavbarProfileMenu profile={profile} />
          </div>
        </div>
      </div>
    </header>
  )
}
