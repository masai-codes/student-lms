'use client'

import { NavbarLogo } from './navbar-logo'
import { NavbarNavItems } from './navbar-nav-items'
import { NavbarProfileMenu } from './navbar-profile-menu'
import { NavbarTrailingActions } from './navbar-trailing-actions'
import type { NavbarProps } from './types'

import { LAYOUT_NAVBAR_INNER_CLASSES } from '@/lib/layout'
import { cn } from '@/lib/utils'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'

export function Navbar({
  logo,
  navItems,
  profile,
  trailingActions,
  centerSlot,
  actionsSlot,
  className,
}: NavbarProps) {
  return (
    <header
      data-app-navbar
      className={cn(
        'sticky top-0 z-[210] flex w-full flex-col bg-surface shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] rounded-b-[32px] lg:px-6',
        className,
      )}
    >
      <div
        className={cn(
          LAYOUT_NAVBAR_INNER_CLASSES,
          'justify-between py-3 lg:py-4',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-12">
          <NavbarLogo logo={logo} />
          <NavbarNavItems items={navItems} />
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {centerSlot ?? null}
          <NavbarTrailingActions items={trailingActions ?? []} />
          {actionsSlot ?? null}
          <ThemeSwitcher />
          <NavbarProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  )
}
