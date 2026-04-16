import { useRouterState } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Folder, Calendar, House, Trophy } from '@phosphor-icons/react'
import SidebarItem from './SidebarItem'
import type { Icon } from '@phosphor-icons/react'
import type { MasaiverseTab } from './SidebarItem'

const SidebarList = () => {
  const activeTab = useRouterState({
    select: (state): MasaiverseTab => {
      const tab = state.location.search.tab
      if (
        tab === 'home' ||
        tab === 'events' ||
        tab === 'leaderboard' ||
        tab === 'resources'
      ) {
        return tab
      }
      return 'home'
    },
  })

  const menuItems: Array<{
    id: number
    name: string
    icon: Icon
    tab: MasaiverseTab
  }> = [
    {
      id: 1,
      name: 'Home',
      icon: House,
      tab: 'home',
    },
    {
      id: 2,
      name: 'Events',
      icon: Calendar,
      tab: 'events',
    },
    // {
    //   id: 3,
    //   name: "Leaderboard",
    //   icon: Trophy,
    //   tab: "leaderboard",
    // },
    // {
    //   id: 4,
    //   name: "Resources",
    //   icon: Folder,
    //   tab: "resources",
    // }
  ]

  return (
    <div className="my-[24px] flex flex-col gap-[10px]">
      {menuItems.map((item) => (
        <SidebarItem
          key={item.id}
          name={item.name}
          icon={item.icon}
          tab={item.tab}
          isActive={activeTab === item.tab}
        />
      ))}
      <Link
        to="/masaiverse"
        search={(prev) => ({
          ...prev,
          tab: 'home',
          createDiscussion: true,
        })}
        className="mt-2 block"
      >
        <div className="cursor-pointer rounded-[10px] border border-[#EF8833] bg-[#FFF7ED] px-4 py-[10px] text-center text-[14px] font-semibold leading-5 text-[#C96B1E] hover:bg-[#FBE7D6]">
          Create Discussion
        </div>
      </Link>
    </div>
  )
}

export default SidebarList
