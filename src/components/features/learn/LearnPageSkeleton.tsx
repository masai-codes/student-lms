import { LearnContentListSkeleton } from './section-three/LearnContentListSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'

/** Initial-load placeholder for `/learn` — mirrors the header, controls and list. */
export function LearnPageSkeleton() {
  return (
    <div className="mt-[-24px] w-full">
      <div className="ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip rounded-b-[32px] bg-white">
        <div
          className={`mx-auto w-full pt-[20px] ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X}`}
        >
          <Skeleton className="h-7 w-56" />

          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-11 w-[300px] rounded-lg" />
              <Skeleton className="h-11 w-[170px] rounded-lg" />
              <Skeleton className="size-11 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <LearnContentListSkeleton />
    </div>
  )
}
