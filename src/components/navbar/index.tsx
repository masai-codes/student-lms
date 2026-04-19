'use client'

import { NavbarLogo } from './navbar-logo'
import { NavbarNavItems } from './navbar-nav-items'
import { NavbarProfileMenu } from './navbar-profile-menu'
import { NavbarTrailingActions } from './navbar-trailing-actions'
import type { NavbarProps } from './types'

import { LAYOUT_NAVBAR_INNER_CLASSES } from '@/lib/layout'
import { cn } from '@/lib/utils'

export function Navbar({
  logo,
  navItems,
  profile,
  trailingActions,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        /* Outer bar matches legacy DesktopNavbar; shadow = v3 `.shadow-sm` (0 1px 2px / 5%), not Tailwind v4’s heavier `shadow-sm` token. */
        'sticky top-0 z-[210] flex w-full flex-col bg-white shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] md:px-[24px] rounded-b-[32px]',
        className,
      )}
    >
      <div
        className={cn(
          LAYOUT_NAVBAR_INNER_CLASSES,
          'justify-between py-3 md:py-4',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <NavbarLogo logo={logo} />
          <NavbarNavItems items={navItems} />
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <NavbarTrailingActions items={trailingActions ?? []} />
          <NavbarProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  )
}
