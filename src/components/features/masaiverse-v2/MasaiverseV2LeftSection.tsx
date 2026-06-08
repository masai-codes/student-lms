import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import AdminModeToggle from './AdminModeToggle'
import MyClubsSection from './MyClubsSection'
import SidebarNavItem from './SidebarNavItem'
import { SIDEBAR_NAV_ITEMS } from './data/sidebarNavItems'
import { masaiverseV2MyClubsQuery } from '@/query/masaiverse-v2/clubsQuery'

/**
 * Masaiverse v2 — left section (sidebar).
 *
 * Persistent across all `/masaiverse/*` routes. "My Clubs" is fetched live for
 * the current user; navigation is path-based. Owns the divider border that
 * separates it from the right (content) section.
 */
export default function MasaiverseV2LeftSection() {
  const { data: myClubs = [], isPending: isLoadingClubs } = useQuery(
    masaiverseV2MyClubsQuery(),
  )
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const activeClubId = pathname.startsWith('/masaiverse/club/')
    ? pathname.slice('/masaiverse/club/'.length)
    : undefined

  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[20%] shrink-0 self-start overflow-y-auto border-r border-[#E5E7EB] bg-white py-6 pl-4 pr-4 md:block">
      <div className="mb-5 flex justify-center border-b border-[#E5E7EB] px-1 pb-6">
        <img src="/Masaiverse.svg" alt="Masaiverse" className="h-16 w-auto" />
      </div>

      <AdminModeToggle />

      <nav className="mt-6 flex flex-col gap-1">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            to={item.to}
            isActive={pathname === item.to}
          />
        ))}
      </nav>

      <MyClubsSection
        clubs={myClubs}
        activeClubId={activeClubId}
        isLoading={isLoadingClubs}
      />
    </aside>
  )
}
