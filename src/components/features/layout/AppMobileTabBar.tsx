'use client'

import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Headphones, Home, LayoutGrid, MessageSquare, MonitorPlay, Users } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'
import { UpcomingLecturePill } from '@/components/features/layout/UpcomingLecturePill'
import { activeAppNavIdForPathname } from '@/lib/appNavActiveItem'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

function oldUiNavigate(path: string) {
  const url = getOldStudentUiUrlForPath(path)
  if (url) window.location.assign(url)
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
        onClick: () => { void navigate({ to: '/' }) },
      },
      {
        id: 'learn',
        label: 'Learn',
        icon: <MonitorPlay strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'learn',
        onClick: () => oldUiNavigate(OLD_STUDENT_UI_NAV_PATHS.learn),
      },
      {
        id: 'support',
        label: 'Support',
        icon: <Headphones strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: false,
        onClick: () => oldUiNavigate(OLD_STUDENT_UI_NAV_PATHS.support),
      },
      {
        id: 'chat',
        label: 'Chat',
        icon: <MessageSquare strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: false,
        onClick: () => oldUiNavigate(OLD_STUDENT_UI_NAV_PATHS.chat),
      },
      {
        id: 'forum',
        label: 'Forum',
        icon: <Users strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: false,
        onClick: () => oldUiNavigate(OLD_STUDENT_UI_NAV_PATHS.discussions),
      },
      {
        id: 'more',
        label: 'More',
        icon: <LayoutGrid strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: false,
        onClick: () => oldUiNavigate(OLD_STUDENT_UI_NAV_PATHS.profileSettings),
      },
    ],
    [activeId, navigate],
  )

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] lg:hidden"
      data-app-mobile-tab-bar
    >
      <div>
        <UpcomingLecturePill className="w-full rounded-t-[14px]" />
      </div>
      <TabNavbar
        items={items}
        ariaLabel="Primary navigation"
        labelClassName="text-xs"
        className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      />
    </div>
  )
}
