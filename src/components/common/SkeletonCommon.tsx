import { Skeleton } from '@/components/ui/skeleton'

export default function SkeletonCommon() {
  return (
    <div className="p-4 bg-white border rounded-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex gap-4 flex-1">
          {/* Icon */}
          <Skeleton className="h-10 w-10 rounded-md" />

          {/* Text */}
          <div className="space-y-3 flex-1">
            {/* Title */}
            <Skeleton className="h-5 w-[60%]" />

            {/* Subtitle */}
            <Skeleton className="h-4 w-[45%]" />

            {/* Tags */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right status icon */}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}
