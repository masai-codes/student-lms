import { Skeleton } from '@/components/ui/skeleton'

function HeroCardSkeleton() {
  return (
    <div
      className="w-full rounded-2xl border border-border bg-surface overflow-hidden flex"
      style={{ minHeight: 380 }}
    >
      {/* Left */}
      <div className="flex flex-col justify-center gap-8 px-6 py-6 w-1/2 shrink-0">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-5 w-1/2 rounded" />
          <div className="flex flex-col gap-1.5 mt-1">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/6 rounded" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-lg shrink-0" />
        </div>
      </div>
      {/* Right image placeholder */}
      <div className="flex-1 bg-surface-muted" />
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-36 rounded" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FileCardRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3"
          style={{ height: 72 }}
        >
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-10 w-20 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  )
}

function SectionSkeleton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton
        className={`h-7 rounded`}
        style={{ width: `${label.length * 10}px` }}
      />
      {children}
    </div>
  )
}

function InstructorsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-48 rounded" />
      <div className="flex gap-4 flex-wrap">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
            style={{ minWidth: 200 }}
          >
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvaluationsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-36 rounded" />
      <div className="flex gap-8 flex-wrap">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between gap-4"
            style={{ minWidth: 280, minHeight: 160 }}
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
            <div className="flex justify-end gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CourseStructureSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-44 rounded" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-center gap-4"
          >
            <Skeleton className="size-5 rounded-full shrink-0" />
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3 w-20 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoursePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-2 py-4 max-w-[1280px] mx-auto">
      <HeroCardSkeleton />
      <TimelineSkeleton />
      <SectionSkeleton label="Resources">
        <FileCardRowSkeleton count={4} />
      </SectionSkeleton>
      <InstructorsSkeleton />
      <EvaluationsSkeleton />
      <CourseStructureSkeleton />
    </div>
  )
}
