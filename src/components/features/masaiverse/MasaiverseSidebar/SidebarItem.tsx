import { Link } from "@tanstack/react-router"

export type MasaiverseTab = "home" | "events" | "leaderboard" | "resources"

type SidebarItemProps = {
  name: string
  icon: string
  tab: MasaiverseTab
  isActive: boolean
}

const SidebarItem = ({ name, icon, tab, isActive }: SidebarItemProps) => {
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
        <img src={icon} alt={name} className="h-5 w-5" />
        <span className="text-[14px] font-medium leading-5 text-[#4B5563]">{name}</span>
      </div>
    </Link>
  )
}

export default SidebarItem