'use client'

import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Home, LayoutGrid, Users } from 'lucide-react'

import { TabNavbar } from '@/components/tab-navbar'

function activeTabIdForPathname(pathname: string): string | undefined {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/learn')) return 'learn'
  if (pathname.startsWith('/masaiverse')) return 'masaiverse'
  if (
    pathname.startsWith('/assignments') ||
    pathname.startsWith('/lectures') ||
    pathname.startsWith('/resources')
  ) {
    return 'learn'
  }
  return undefined
}

export default function AppMobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const activeId = activeTabIdForPathname(pathname)

  const items = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: <Home strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'home',
        onClick: () => {
          void navigate({ to: '/learn' })
        },
      },
      {
        id: 'learn',
        label: 'Learn',
        icon: <LayoutGrid strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'learn',
        onClick: () => {
          void navigate({ to: '/learn' })
        },
      },
      {
        id: 'masaiverse',
        label: 'MasaiVerse',
        icon: <Users strokeWidth={1.75} className="size-6 shrink-0 text-current" />,
        isActive: activeId === 'masaiverse',
        onClick: () => {
          void navigate({ to: '/masaiverse' })
        },
      },
    ],
    [activeId, navigate],
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
