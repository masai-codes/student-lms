import { Bookmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function BookmarkCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface">
      <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-[55%] rounded" />
          <Skeleton className="h-4 w-[15%] rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-[40%] rounded" />
        <Skeleton className="h-3 w-[30%] rounded" />
      </div>
    </div>
  )
}

export function BookmarkListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <BookmarkCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BookmarksEmptyState() {
  return (
    <div
      data-testid="bookmarks-empty"
      className="flex flex-col items-center justify-center py-24 gap-4"
    >
      <Bookmark
        size={48}
        strokeWidth={1}
        className="text-foreground-subtle animate-dash-float"
      />
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          No Bookmarks Yet
        </p>
        <p className="mt-1 text-sm text-foreground-subtle">
          Save lectures, assignments, and resources to find them quickly later.
        </p>
      </div>
    </div>
  )
}
