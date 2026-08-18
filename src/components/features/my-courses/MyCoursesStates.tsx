import { GraduationCap } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'

function MyCourseCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-4">
      <Skeleton className="size-10 md:size-14 rounded-xl" />
      <Skeleton className="mt-3 h-5 w-[70%] rounded" />
      <Skeleton className="mt-2 h-4 w-[35%] rounded" />
      <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
      <div className="mt-1.5 flex items-center justify-between">
        <Skeleton className="h-3 w-[30%] rounded" />
        <Skeleton className="h-3 w-8 rounded" />
      </div>
      <Skeleton className="mt-5 h-10 w-[40%] self-end rounded-lg" />
    </div>
  )
}

export function MyCoursesSkeleton() {
  return (
    <div
      data-testid="my-courses-skeleton"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 4 }).map((_, i) => (
        <MyCourseCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MyCoursesEmptyState() {
  return (
    <div
      data-testid="my-courses-empty-state"
      className="flex flex-col items-center justify-center gap-4 py-24"
    >
      <GraduationCap
        size={48}
        weight="duotone"
        className="text-foreground-subtle animate-dash-float"
      />
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          No programs yet
        </p>
        <p className="mt-1 text-sm text-foreground-subtle">
          Your enrolled programs will appear here. If you think this is a
          mistake, reach out to support.
        </p>
      </div>
    </div>
  )
}

export function MyCoursesErrorState() {
  return (
    <div
      data-testid="my-courses-error-state"
      className="flex flex-col items-center justify-center gap-4 py-24"
    >
      <GraduationCap
        size={48}
        weight="duotone"
        className="text-foreground-subtle"
      />
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          Couldn&apos;t load your programs
        </p>
        <p className="mt-1 text-sm text-foreground-subtle">
          Something went wrong on our side. Please refresh the page to try again.
        </p>
      </div>
    </div>
  )
}
