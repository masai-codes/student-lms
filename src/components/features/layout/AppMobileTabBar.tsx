'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { Headphones, Home, LayoutGrid, MonitorPlay, MessagesSquare } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { fetchNavbarBadgeCounts } from '@/server/navbar/fetchNavbarBadgeCounts'

/** Same cadence as `AppNavbar` / legacy `REFETCH_INTERVAL`. */
const BADGE_REFETCH_MS = 2 * 60 * 1000

function navigateToOldStudentPath(path: string) {
  const url = getOldStudentUiUrlForPath(path)
  if (!url) {
    console.warn('VITE_OLD_STUDENT_UI_URL is not configured')
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

function ChatTabIcon({ chatUnread }: { chatUnread: number }) {
  const count = chatUnread > 0 ? chatUnread : 0
  const display = count > 9 ? '9+' : String(count)
  const badge =
    count > 0 ? (
      <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 font-poppins text-[10px] leading-none font-medium text-white">
        {display}
      </span>
    ) : null

  return (
    <span className="relative inline-flex items-center justify-center text-current">
      <MessagesSquare strokeWidth={1.75} className="size-6 shrink-0 text-current" />
      {badge}
    </span>
  )
}

export default function AppMobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeId = activeTabIdForPathname(pathname)

  const { data: badgeCounts } = useQuery({
    queryKey: ['navbarBadgeCounts'],
    queryFn: () => fetchNavbarBadgeCounts(),
    refetchInterval: import.meta.env.DEV ? false : BADGE_REFETCH_MS,
    refetchIntervalInBackground: false,
  })

  const chatUnread = badgeCounts?.chatUnread ?? 0

  const items = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: <Home strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'home',
        onClick: () => navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.home),
      },
      {
        id: 'learn',
        label: 'Learn',
        icon: <MonitorPlay strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'learn',
        onClick: () => navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.learn),
      },
      {
        id: 'support',
        label: 'Support',
        icon: <Headphones strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'support',
        onClick: () => navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.support),
      },
      {
        id: 'chat',
        label: 'Chat',
        icon: <ChatTabIcon chatUnread={chatUnread} />,
        isActive: activeId === 'chat',
        onClick: () => navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.chat),
      },
      {
        id: 'more',
        label: 'More',
        icon: <LayoutGrid strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: false,
        onClick: () => navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.profileSettings),
      },
    ],
    [activeId, chatUnread],
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] md:hidden">
      <TabNavbar
        items={items}
        ariaLabel="Primary navigation"
        labelClassName="text-xs"
        className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      />
    </div>
  )
}
