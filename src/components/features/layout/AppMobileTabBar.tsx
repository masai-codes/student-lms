'use client'

import { LayoutGrid } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { TabNavbar } from '@/components/tab-navbar'
import type { TabNavbarItem } from '@/components/tab-navbar/types'
import { useAppNavItems } from '@/lib/navigation/useAppNavItems'
import type { NavItem } from '@/lib/navigation/navItemConfig'

/**
 * Selects the fixed mobile tab bar. Keep in sync with the `data-app-mobile-tab-bar`
 * attribute below; consumers use it to reserve bottom viewport space (the bar is
 * `lg:hidden`, so it only reserves space on mobile/tablet).
 */
export const APP_MOBILE_TAB_BAR_SELECTOR = '[data-app-mobile-tab-bar]'

function toTabNavbarItem(
  item: NavItem,
  navigate: ReturnType<typeof useNavigate>,
): TabNavbarItem {
  const icon = item.icon ? (
    <item.icon />
  ) : (
    <span className="size-6 shrink-0" aria-hidden />
  )
  const onClick =
    item.type === 'internal-link'
      ? () => void navigate({ to: item.to, search: {} })
      : item.type === 'external-link'
        ? () => window.open(item.href, '_blank', 'noopener,noreferrer')
        : () => item.onClick()

  return {
    id: item.id,
    label: item.label ?? '',
    icon,
    isActive: item.isActive,
    onClick,
  }
}

/**
 * Mobile Tier 1: mirrors the desktop navbar's Tier 1 tabs exactly (same
 * `useAppNavItems` source — no separately maintained item list), plus the
 * "More" tab, which opens `/profile-settings` exactly as the old LMS bottom nav
 * does. Mobile has no avatar dropdown and no trailing icon cluster, so that
 * page is the only route to profile, My Programs, Bookmarks, Level up and
 * sign-out on small screens.
 */
export default function AppMobileTabBar() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { tier1 } = useAppNavItems()

  const items: TabNavbarItem[] = [
    ...tier1.map((item) => toTabNavbarItem(item, navigate)),
    {
      id: 'more',
      label: 'More',
      icon: (
        <LayoutGrid
          strokeWidth={1.75}
          className="size-6 shrink-0 text-current"
        />
      ),
      // Both `/profile-settings` and `/profile` light the tab: the hub is the
      // only way into the profile page on mobile, so they are one destination
      // from the student's point of view.
      isActive:
        pathname.startsWith('/profile-settings') ||
        pathname.startsWith('/profile'),
      onClick: () => void navigate({ to: '/profile-settings' }),
    },
  ]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-200 lg:hidden"
      data-app-mobile-tab-bar
    >
      <TabNavbar
        items={items}
        ariaLabel="Primary navigation"
        labelClassName="text-[10px]"
        className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
      />
    </div>
  )
}
