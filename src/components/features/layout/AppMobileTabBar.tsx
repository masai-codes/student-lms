'use client'

import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Home, LayoutGrid, Users } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

function navigateToOldStudentPath(path: string) {
  const url = getOldStudentUiUrlForPath(path)
  if (!url) {
    console.warn('VITE_OLD_STUDENT_UI_URL is not configured')
    return
  }
  window.location.assign(url)
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
        icon: <Home strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'home',
        onClick: () => {
          navigateToOldStudentPath(OLD_STUDENT_UI_NAV_PATHS.home)
        },
      },
      {
        id: 'learn',
        label: 'Learn',
        icon: <LayoutGrid strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'learn',
        onClick: () => {
          void navigate({ to: '/learn', search: { batchId: undefined } })
        },
      },
      {
        id: 'masaiverse',
        label: 'MasaiVerse',
        icon: <Users strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
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
