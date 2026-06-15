import { Skeleton } from '@/components/ui/skeleton'

/**
 * Card-shaped placeholders that mirror the real cards' dimensions so content
 * loads without a layout shift. All use the same neutral gray.
 */
const BAR = 'bg-[#EDEAE8]'

/** Renders `count` copies of a skeleton, for grids/rows. */
export function repeat(count: number, render: (key: number) => React.ReactNode) {
  return Array.from({ length: count }, (_, index) => render(index))
}

export function EventCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[#EDEAE8] bg-white">
      <Skeleton className={`h-[116px] rounded-none ${BAR}`} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className={`h-3 w-16 ${BAR}`} />
        <Skeleton className={`h-4 w-4/5 ${BAR}`} />
        <Skeleton className={`h-3 w-3/5 ${BAR}`} />
      </div>
    </div>
  )
}

export function HighlightCardSkeleton() {
  return (
    <div className="flex h-full gap-3 rounded-[14px] border border-[#EDEAE8] bg-white p-4">
      <Skeleton className={`size-6 rounded-md ${BAR}`} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className={`h-3 w-1/3 ${BAR}`} />
        <Skeleton className={`h-4 w-3/4 ${BAR}`} />
        <Skeleton className={`h-3 w-1/2 ${BAR}`} />
      </div>
    </div>
  )
}

export function HomeClubCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-[#EDEAE8] bg-white p-4">
      <div className="flex items-center gap-3">
        <Skeleton className={`size-11 rounded-[12px] ${BAR}`} />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className={`h-4 w-1/2 ${BAR}`} />
          <Skeleton className={`h-3 w-1/3 ${BAR}`} />
        </div>
      </div>
      <Skeleton className={`mt-3 h-3 w-full ${BAR}`} />
      <Skeleton className={`mt-2 h-3 w-4/5 ${BAR}`} />
      <Skeleton className={`mt-4 h-5 w-24 rounded-full ${BAR}`} />
    </div>
  )
}

export function DiscussionRowSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-[#EDEAE8] py-4 last:border-b-0">
      <Skeleton className={`size-10 shrink-0 rounded-full ${BAR}`} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className={`h-3 w-40 ${BAR}`} />
        <Skeleton className={`h-4 w-3/4 ${BAR}`} />
        <div className="mt-1 flex gap-3">
          <Skeleton className={`h-5 w-16 rounded-full ${BAR}`} />
          <Skeleton className={`h-5 w-16 rounded-full ${BAR}`} />
        </div>
      </div>
    </div>
  )
}
