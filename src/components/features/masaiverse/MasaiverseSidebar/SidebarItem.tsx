import { Link } from "@tanstack/react-router"
import type { Icon } from "@phosphor-icons/react"

export type MasaiverseTab = "home" | "events" | "leaderboard" | "resources"

type SidebarItemProps = {
  name: string
  icon: Icon
  tab: MasaiverseTab
  isActive: boolean
}

const SidebarItem = ({ name, icon, tab, isActive }: SidebarItemProps) => {
  const IconComponent = icon

  return (
    <Link
      to="/masaiverse"
      search={(prev) => ({
        ...prev,
        tab,
      })}
      className="block"
    >
      <div
        className={`cursor-pointer flex items-center gap-2.5 rounded-[10px] px-4 py-[10px] ${
          isActive ? "bg-[#EF8833]" : "bg-[#FBF9F9]"
        }`}
      >
        <IconComponent
          size={20}
          weight="regular"
          color={isActive ? "#FFFFFF" : "#000000"}
        />
        <span
          className={`text-[14px] font-medium leading-5 ${
            isActive ? "text-white" : "text-black"
          }`}
        >
          {name}
        </span>
      </div>
    </Link>
  )
}

export default SidebarItem