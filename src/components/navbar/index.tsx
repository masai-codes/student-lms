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

/** Hairline vertical rule separating groups inside a row. */
function RowDivider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-6 w-px shrink-0 bg-border', className)}
    />
  )
}

/**
 * Two-tier app navbar (Masai IA v1).
 *
 * Row 1 (Tier 1, global, 56px): logo + primary `navItems` (Home/Learn/
 * Community/Interviews) on the left; the icon cluster (`trailingActions` —
 * Announcements), `secondaryRowLinks` (Refer & Earn), `primaryRowActions`
 * (Get the app), `actionsSlot` and the profile menu on the right.
 *
 * Row 2 (Tier 2, per-module, 44px): `tier2` renders below a hairline divider
 * only when the active module has sub-nav (Learn, Community). Home and
 * Interviews pass no `tier2`, so the row is omitted entirely rather than
 * shown empty.
 */
export function Navbar({
  logo,
  navItems,
  profile,
  trailingActions,
  primaryRowActions,
  secondaryRowLinks,
  tier2,
  actionsSlot,
  className,
  forceDark,
}: NavbarProps) {
  const hasSecondaryLinks = Boolean(secondaryRowLinks?.length)
  const hasIconCluster = Boolean(trailingActions?.length)

  return (
    <header
      data-app-navbar
      data-testid="navbar"
      data-theme={forceDark ? FORCE_DARK_THEME_ID : undefined}
      className={cn(
        'sticky top-0 z-[210] flex w-full flex-col border-b border-border bg-surface shadow-sm lg:px-6',
        // Forced-dark navbar sits over a light page, so the rounded bottom
        // corners would otherwise reveal the light page as white slivers. Keep
        // the rounded look but back the header with a square dark layer (the
        // midnight page background), so the corner cutouts show dark instead.
        forceDark &&
          'dark before:absolute before:inset-0 before:-z-10 before:rounded-b-none before:bg-background before:content-[""]',
        className,
      )}
    >
      {/* Row 1 (Tier 1): logo + primary nav, icon cluster + CTAs + profile. */}
      <div
        data-testid="navbar-row-primary"
        className={cn(
          LAYOUT_NAVBAR_INNER_CLASSES,
          'h-14 items-stretch justify-between gap-3',
        )}
      >
        <div className="flex min-w-0 flex-1 items-stretch gap-4 xl:gap-8 2xl:gap-12">
          <NavbarLogo logo={logo} />
          <NavbarNavItems items={navItems} />
        </div>

        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          <NavbarTrailingActions items={secondaryRowLinks ?? []} />
          {primaryRowActions?.length ? (
            <NavbarTrailingActions items={primaryRowActions} />
          ) : null}
          {actionsSlot ?? null}
          {hasSecondaryLinks && hasIconCluster ? <RowDivider /> : null}
          <NavbarTrailingActions items={trailingActions ?? []} />
          {/* <ThemeSwitcher /> */}
          <NavbarProfileMenu profile={profile} />
        </div>
      </div>

      {/* Row 2 (Tier 2): omitted entirely when the active module has none.
          The border-top lives on this full-width wrapper (not the max-w
          inner row) so the hairline spans the whole header, matching the
          tier 1 bottom border. An invisible logo mirrors tier 1's logo
          column so tier 2 content lines up with the tier 1 nav items. */}
      {tier2 ? (
        <div className="w-full border-t border-border">
          <div
            data-testid="navbar-row-tier2"
            className={cn(LAYOUT_NAVBAR_INNER_CLASSES, 'h-11 items-stretch')}
          >
            <div className="flex min-w-0 flex-1 items-stretch gap-4 xl:gap-8 2xl:gap-12">
              <NavbarLogo logo={logo} decorative />
              <div className="flex min-w-0 flex-1 items-stretch justify-between gap-3">
                {tier2}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
