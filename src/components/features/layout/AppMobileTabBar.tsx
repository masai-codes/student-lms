'use client'

import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Home, LayoutGrid, Users } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

function navigateToOldStudentPath(path: string) {
  const url = getOldStudentUiUrlForPath(path)
  if (!url) {
    console.warn('Legacy student app URL is not configured for this origin')
    return
  }
  window.location.assign(url)
}

/**
 * While the user is still in this SPA, approximate which bottom tab matches the current route.
 * “More” is only meaningful on the legacy host (`/profile-settings`), so it stays inactive here.
 */
function activeTabIdForPathname(pathname: string): string | undefined {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/courses')) return 'learn'
  if (pathname.startsWith('/support')) return 'support'
  if (pathname.startsWith('/chat')) return 'chat'
  return undefined
}

function ChatTabIcon() {
  return (
    <span className="relative inline-flex items-center justify-center text-current">
      <MessagesSquare
        strokeWidth={1.75}
        className="size-6 shrink-0 text-current"
      />
    </span>
  )
}

export default function AppMobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const activeId = activeAppNavIdForPathname(pathname)

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
          <LayoutGrid
            strokeWidth={1.75}
            className="size-6 shrink-0 text-current"
          />
        ),
        isActive: activeId === 'learn',
        onClick: () => {
          void navigate({ to: '/learn', search: { batchId: undefined } })
        },
      },
      {
        id: 'masaiverse',
        label: 'MasaiVerse',
        icon: (
          <Users strokeWidth={1.75} className="size-6 shrink-0 text-current" />
        ),
        isActive: activeId === 'masaiverse',
        onClick: () => {
          void navigate({ to: '/masaiverse', search: { tab: 'home' } })
        },
      },
    ],
    [activeId, navigate],
  )

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] md:hidden"
      data-app-mobile-tab-bar
    >
      <TabNavbar
        items={items}
        ariaLabel="Primary navigation"
        labelClassName="text-xs"
        className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      />
    </div>
  )
}
