import { Skeleton } from '@/components/ui/skeleton'

export function DashboardActionBannerSkeleton() {
  return (
    <div
      className="rounded-2xl px-5 pt-4 pb-12 flex items-center gap-4 min-h-[64px]"
      style={{ background: 'linear-gradient(90.38deg, #4B4396 2.62%, #6962AC 100%)' }}
    >
      <Skeleton className="size-5 shrink-0 bg-white/20 rounded-full" />
      <Skeleton className="h-4 flex-1 bg-white/20 rounded" />
      <Skeleton className="h-9 w-28 shrink-0 bg-white/20 rounded-md" />
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="size-8 bg-white/20 rounded-lg" />
        <Skeleton className="size-2 bg-white/20 rounded-full" />
        <Skeleton className="size-8 bg-white/20 rounded-lg" />
      </div>
    </div>
  )
}
