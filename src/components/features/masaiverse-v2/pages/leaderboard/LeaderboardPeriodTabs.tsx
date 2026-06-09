import type { LeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** Overall vs. this-month toggle shared by the global and club leaderboards. */
export default function LeaderboardPeriodTabs({
  value,
  onChange,
}: {
  value: LeaderboardPeriod
  onChange: (period: LeaderboardPeriod) => void
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as LeaderboardPeriod)}
    >
      <TabsList className="bg-[#F1ECE8]">
        <TabsTrigger value="overall" className="px-3">
          Overall
        </TabsTrigger>
        <TabsTrigger value="month" className="px-3">
          This month
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
