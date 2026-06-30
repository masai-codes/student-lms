import { Skeleton } from '@/components/ui/skeleton'

/** A few placeholder cards is enough of a loading hint; the real page holds more. */
const DEFAULT_SKELETON_COUNT = 6

/** Gray placeholder matching `LearnContentCard`'s footprint (icon + title + meta + tags). */
function LearnContentCardSkeleton() {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-28 self-start rounded-full md:self-center" />
      </div>
    </div>
  )
}

export function LearnContentListSkeleton({
  count = DEFAULT_SKELETON_COUNT,
}: {
  count?: number
}) {
  return (
    <section
      className="mt-[16px] space-y-3"
      aria-busy="true"
      aria-label="Loading items"
    >
      {Array.from({ length: count }).map((_, index) => (
        <LearnContentCardSkeleton key={index} />
      ))}
    </section>
  )
}
