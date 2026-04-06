import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

export type DiscussionType = 'lecture' | 'assignment' | 'resources'

type TabType = 'all' | DiscussionType

const tabs: Array<{ label: string; value: TabType }> = [
  { label: 'All', value: 'all' },
  { label: 'Lectures', value: 'lecture' },
  { label: 'Assignments', value: 'assignment' },
  { label: 'Resources', value: 'resources' }, // ✅ FIXED
]

export default function DiscussionTabFilters({
  activeType,
}: {
  activeType?: DiscussionType
}) {
  return (
    <div className="flex gap-3">
      {tabs.map((tab) => {
        const isActive =
          (tab.value === "all" && !activeType) ||
          activeType === tab.value

        return (
          <Link
            key={tab.value}
            to="/discussions"
            search={{
              page: undefined,
              type: tab.value === "all" ? undefined : tab.value,
            }}
            className={cn(
              "rounded-xl border px-5 py-2 text-sm font-medium transition",
              isActive
                ? "border-[#6D67E4] bg-[#F4F3FF] text-[#6D67E4]"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
