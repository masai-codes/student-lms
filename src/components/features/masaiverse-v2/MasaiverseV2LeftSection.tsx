import { useRouterState } from '@tanstack/react-router'
import MyClubsSection from './MyClubsSection'
import SidebarNavItem from './SidebarNavItem'
import { SIDEBAR_DUMMY_DATA } from './data/sidebarDummyData'
import { SIDEBAR_NAV_ITEMS } from './data/sidebarNavItems'

/**
 * Masaiverse v2 — left section (sidebar).
 *
 * Persistent across all `/masaiverse/*` routes. Static dummy data for now
 * (`SIDEBAR_DUMMY_DATA`); navigation is path-based. Owns the divider border
 * that separates it from the right (content) section.
 */
export default function MasaiverseV2LeftSection() {
  const { myClubs, eventsCount } = SIDEBAR_DUMMY_DATA
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const activeClubId = pathname.startsWith('/masaiverse/club/')
    ? pathname.slice('/masaiverse/club/'.length)
    : undefined

  return (
    <aside className="hidden w-[20%] shrink-0 border-r border-[#E5E7EB] py-6 pr-4 md:block">
      <div className="px-1">
        <h1 className="text-[20px] font-bold leading-7 text-[#111827]">
          MasaiVerse
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
          Your learning community
        </p>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            to={item.to}
            isActive={pathname === item.to}
            badgeCount={item.id === 'events' ? eventsCount : undefined}
          />
        ))}
      </nav>

      <MyClubsSection clubs={myClubs} activeClubId={activeClubId} />
    </aside>
  )
}
