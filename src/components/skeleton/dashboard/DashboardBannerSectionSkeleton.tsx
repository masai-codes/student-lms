import { Skeleton } from '@/components/ui/skeleton'

export function DashboardBannerSectionSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Matches BannerSlideCard: rounded-[16px] border px-6 py-4 flex items-center gap-3 min-h-[84px] */}
      <div
        className="relative w-full rounded-[16px] border px-6 py-4 flex items-center gap-3 min-h-[84px]"
        style={{ borderColor: '#C3DDFD', background: 'linear-gradient(90deg, #E1EFFE 0%, #FFFFFF 100%)' }}
      >
        <Skeleton className="size-12 shrink-0 rounded-md bg-blue-100" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-3/5 rounded bg-blue-100" />
          <Skeleton className="h-3 w-2/5 rounded bg-blue-100" />
        </div>
      </div>

      {/* Dots — matches the real dot row below the banner */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-1.5 rounded-full" />
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="size-1.5 rounded-full" />
      </div>
    </div>
  )
}
