import SidebarItem from "./SidebarItem"
import { useRouterState } from "@tanstack/react-router"
import type { MasaiverseTab } from "./SidebarItem"

const SidebarList = () => {
  const activeTab = useRouterState({
    select: (state): MasaiverseTab => {
      const tab = state.location.search.tab
      if (
        tab === "home" ||
        tab === "events" ||
        tab === "leaderboard" ||
        tab === "resources"
      ) {
        return tab
      }
      return "home"
    },
  })

  const menuItems = [
    {
      id: 1,
      name: "Home",
      icon: "https://masai-drive-uploads-prod.s3.ap-south-1.amazonaws.com/drive/69c5405a1048890fc9f0c63c/1775486319057-0869df190ba1c691.png",
      tab: "home",
    },
    {
      id: 2,
      name: "Events",
      icon: "https://masai-drive-uploads-prod.s3.ap-south-1.amazonaws.com/drive/69c5405a1048890fc9f0c63c/1775486309019-0ceab3de60fe6ae9.png",
      tab: "events",
    },
    {
      id: 3,
      name: "Leaderboard",
      icon: "https://masai-drive-uploads-prod.s3.ap-south-1.amazonaws.com/drive/69c5405a1048890fc9f0c63c/1775486339356-bd691808ec240d0d.png",
      tab: "leaderboard",
    },
    {
      id: 4,
      name: "Resources",
      icon: "https://masai-drive-uploads-prod.s3.ap-south-1.amazonaws.com/drive/69c5405a1048890fc9f0c63c/1775486313269-608e08dd285c7128.png",
      tab: "resources",
    }
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
    </div>
  )
}

export default SidebarList