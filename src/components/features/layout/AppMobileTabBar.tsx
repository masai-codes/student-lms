'use client'

import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { BriefcaseBusiness, Home, MonitorPlay, User, Users } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { hidesMasaiOnlyFeatures } from '@/utils/portal'

/**
 * Selects the fixed mobile tab bar. Keep in sync with the `data-app-mobile-tab-bar`
 * attribute below; consumers use it to reserve bottom viewport space (the bar is
 * `lg:hidden`, so it only reserves space on mobile/tablet).
 */
export const APP_MOBILE_TAB_BAR_SELECTOR = '[data-app-mobile-tab-bar]'

function oldUiNavigate(path: string) {
  const url = getOldStudentUiUrlForPath(path)
  if (url) window.location.assign(url)
}

/**
 * Mobile Tier 1: Home · Learn · Community · Interviews · Profile, mirroring
 * the desktop navbar's primary nav (Masai IA v1). Community and Interviews
 * are Masai-only surfaces, same gate as the desktop navbar.
 */
export default function AppMobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const activeId = activeAppNavIdForPathname(pathname)
  const hideMasaiExtras = hidesMasaiOnlyFeatures()

  const items = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: (
          <Home strokeWidth={1.75} className="size-6 shrink-0 text-current" />
        ),
        isActive: activeId === 'home',
        onClick: () => {
          void navigate({ to: '/' })
        },
      },
      {
        id: 'learn',
        label: 'Learn',
        icon: (
          <MonitorPlay
            strokeWidth={1.75}
            className="size-6 shrink-0 text-current"
          />
        ),
        isActive: activeId === 'learn',
        onClick: () => {
          void navigate({ to: '/learn', search: {} })
        },
      },
      ...(hideMasaiExtras
        ? []
        : [
            {
              id: 'community',
              label: 'Community',
              icon: (
                <Users
                  strokeWidth={1.75}
                  className="size-6 shrink-0 text-current"
                />
              ),
              isActive: activeId === 'community',
              onClick: () => {
                void navigate({ to: '/masaiverse' })
              },
            },
            {
              id: 'interviews',
              label: 'Interviews',
              icon: (
                <BriefcaseBusiness
                  strokeWidth={1.75}
                  className="size-6 shrink-0 text-current"
                />
              ),
              isActive: false,
              onClick: () => oldUiNavigate('/practice-interview'),
            },
          ]),
      {
        id: 'profile',
        label: 'Profile',
        icon: (
          <User strokeWidth={1.75} className="size-6 shrink-0 text-current" />
        ),
        isActive: false,
        onClick: () => {
          void navigate({ to: '/profile', search: { tab: 'profile-details' } })
        },
      },
    ],
    [activeId, hideMasaiExtras, navigate],
  )

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] lg:hidden"
      data-app-mobile-tab-bar
    >
      <TabNavbar
        items={items}
        ariaLabel="Primary navigation"
        labelClassName="text-xs"
        className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      />
    </div>
  )
}
