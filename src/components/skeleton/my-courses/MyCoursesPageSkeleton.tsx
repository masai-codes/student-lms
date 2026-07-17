import { Skeleton } from '@/components/ui/skeleton'

function CourseCardSkeleton() {
  return (
    <div
      className="relative bg-surface rounded-2xl overflow-hidden"
      style={{ border: '1px solid #E5E7EB', minHeight: 294 }}
    >
      {/* Logo */}
      <div
        className="absolute"
        style={{ left: 16, top: 16, height: 56, width: 100 }}
      >
        <Skeleton className="h-full w-full rounded-md" />
      </div>

      {/* Title + Institute */}
      <div
        className="absolute flex flex-col gap-2"
        style={{ left: 16, right: 16, top: 84 }}
      >
        <Skeleton className="h-7 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>

      {/* Progress */}
      <div
        className="absolute flex flex-col gap-1.5"
        style={{ left: 16, right: 16, top: 182 }}
      >
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
      </div>

      {/* CTA */}
      <div
        className="absolute flex items-center gap-4"
        style={{ right: 16, bottom: 16 }}
      >
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  )
}

export function MyCoursesPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 px-2 py-2"
      style={{ background: '#FAF9F9', minHeight: '100vh' }}
    >
      <Skeleton className="h-7 w-32 rounded" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
