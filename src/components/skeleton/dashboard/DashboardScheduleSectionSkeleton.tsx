import { Skeleton } from '@/components/ui/skeleton'

function ScheduleCardSkeleton({ showDayLabel }: { showDayLabel: boolean }) {
  return (
    <div className="flex items-stretch gap-3">
      {/* Day label column — w-[52px] matches the real card */}
      <div className="w-[52px] shrink-0 flex flex-col items-center pt-3">
        {showDayLabel ? (
          <div className="flex flex-col items-center gap-0.5 min-w-[44px] px-1 py-1.5">
            <Skeleton className="h-3 w-7 rounded" />
            <Skeleton className="h-4 w-7 rounded" />
          </div>
        ) : null}
      </div>

      {/* Card — matches bg-white rounded-[8px] border border-gray-200 p-3 */}
      <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-3/5 rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekGroupSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {/* Week label row — matches type-t1 text + hr */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20 rounded shrink-0" />
        <hr className="flex-1 border-t border-gray-200" />
      </div>

      <div className="flex flex-col gap-2">
        <ScheduleCardSkeleton showDayLabel={true} />
        <ScheduleCardSkeleton showDayLabel={false} />
        <ScheduleCardSkeleton showDayLabel={true} />
      </div>
    </div>
  )
}

export function DashboardScheduleSectionSkeleton() {
  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 overflow-hidden">
      {/* Tab bar — matches px-4 pt-4 pb-0 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-0">
        <Skeleton className="h-9 w-[120px] rounded-md" />
        <Skeleton className="h-9 w-[120px] rounded-md" />
      </div>

      <div className="h-px bg-gray-100 mt-3" />

      {/* Content — matches p-4 max-h-[560px] overflow-y-auto with gap-6 between groups */}
      <div className="p-4 flex flex-col gap-6">
        <WeekGroupSkeleton />
        <WeekGroupSkeleton />
      </div>
    </div>
  )
}
