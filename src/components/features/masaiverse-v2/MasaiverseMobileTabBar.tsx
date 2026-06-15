'use client'

import { useMemo, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, DotsThreeOutline } from '@phosphor-icons/react'

import { SIDEBAR_NAV_ITEMS } from './data/sidebarNavItems'
import type { MasaiverseV2NavPath, MasaiverseV2Tab } from './data/sidebarNavItems'
import { TabNavbar } from '@/components/tab-navbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { MASAIVERSE_EVENTS, trackMasaiverse } from './tracking'

/** Custom event the native app listens for to handle "Back to Masai" itself. */
const REDIRECT_TO_MASAI_EVENT = 'redirect-to-masai'

/**
 * How many Masaiverse tabs sit directly in the bottom bar. The rest collapse
 * into the "More" sheet. Three primary tabs + the "Masai" back arrow + "More"
 * keeps the bar at five comfortable slots on a phone.
 */
const PRIMARY_TAB_COUNT = 3

const PRIMARY_NAV_ITEMS = SIDEBAR_NAV_ITEMS.slice(0, PRIMARY_TAB_COUNT)
const MORE_NAV_ITEMS = SIDEBAR_NAV_ITEMS.slice(PRIMARY_TAB_COUNT)
const MORE_NAV_IDS = new Set<MasaiverseV2Tab>(MORE_NAV_ITEMS.map((i) => i.id))

/**
 * "Back to Masai" — leave Masaiverse and return to the legacy student app home.
 *
 * Inside the native app we don't navigate the webview ourselves; instead we
 * dispatch a `redirect-to-masai` event (like the SSO flow) and let the app
 * handle the redirect natively.
 */
function navigateBackToMasai() {
  if (isMasaiverseApp()) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REDIRECT_TO_MASAI_EVENT))
    }
    return
  }

  const url = getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.home)
  if (!url) {
    console.warn('Legacy student app URL is not configured for this origin')
    return
  }
  window.location.assign(url)
}

/**
 * Approximate which Masaiverse tab matches the current route. Detail pages fold
 * into their section (`/masaiverse/club/123` → clubs, `/masaiverse/event/9` →
 * events) so the parent tab stays highlighted.
 */
function activeMasaiverseTabId(pathname: string): MasaiverseV2Tab | undefined {
  if (pathname === '/masaiverse/home') return 'home'
  if (pathname.startsWith('/masaiverse/club')) return 'clubs'
  if (pathname.startsWith('/masaiverse/event')) return 'events'
  if (pathname.startsWith('/masaiverse/discussions')) return 'discussions'
  if (pathname.startsWith('/masaiverse/leaderboard')) return 'leaderboard'
  return undefined
}

export default function MasaiverseMobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const activeId = activeMasaiverseTabId(pathname)
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Highlight "More" while one of the collapsed items is the active route.
  const isMoreActive = activeId ? MORE_NAV_IDS.has(activeId) : false

  // Preserve search params (e.g. `isApp`) like the sidebar `Link` does.
  const goTo = (to: MasaiverseV2NavPath) =>
    navigate({ to, search: (prev) => prev })

  const items = useMemo(
    () => [
      {
        id: 'back-to-masai',
        label: 'Masai',
        icon: <ArrowLeft size={24} weight="regular" className="text-current" />,
        isActive: false,
        onClick: () => {
          trackMasaiverse(MASAIVERSE_EVENTS.navClick, {
            item: 'back_to_masai',
            surface: 'mobile_tabbar',
          })
          navigateBackToMasai()
        },
      },
      ...PRIMARY_NAV_ITEMS.map(({ id, label, icon: Icon, to }) => ({
        id,
        label,
        icon: (
          <Icon
            size={24}
            weight={activeId === id ? 'fill' : 'regular'}
            className="text-current"
          />
        ),
        isActive: activeId === id,
        onClick: () => {
          trackMasaiverse(MASAIVERSE_EVENTS.navClick, {
            item: id,
            surface: 'mobile_tabbar',
            to,
          })
          navigate({ to, search: (prev) => prev })
        },
      })),
      {
        id: 'more',
        label: 'More',
        icon: (
          <DotsThreeOutline
            size={24}
            weight={isMoreActive ? 'fill' : 'regular'}
            className="text-current"
          />
        ),
        isActive: isMoreActive,
        onClick: () => {
          trackMasaiverse(MASAIVERSE_EVENTS.navClick, {
            item: 'more',
            surface: 'mobile_tabbar',
          })
          setIsMoreOpen(true)
        },
      },
    ],
    [activeId, isMoreActive, navigate],
  )

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[200] md:hidden">
        <TabNavbar
          items={items}
          ariaLabel="Masaiverse navigation"
          labelClassName="text-[11px]"
          className="shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        />
      </div>

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent
          side="bottom"
          className="z-[210] gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))] font-poppins md:hidden"
        >
          <SheetHeader className="px-5 pb-2">
            <SheetTitle className="text-base">More</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-3 pb-2">
            {MORE_NAV_ITEMS.map(({ id, label, icon: Icon, to }) => {
              const isActive = activeId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    trackMasaiverse(MASAIVERSE_EVENTS.navClick, {
                      item: id,
                      surface: 'mobile_more',
                      to,
                    })
                    goTo(to)
                    setIsMoreOpen(false)
                  }}
                  className={`flex items-center gap-2.5 rounded-[10px] px-4 py-3 text-left ${
                    isActive ? 'bg-masaiverse-orange' : 'hover:bg-[#FBF9F9]'
                  }`}
                >
                  <Icon
                    size={22}
                    weight={isActive ? 'fill' : 'regular'}
                    color={isActive ? '#FFFFFF' : '#111827'}
                  />
                  <span
                    className={`flex-1 text-[15px] font-medium leading-5 ${
                      isActive ? 'text-white' : 'text-[#111827]'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
