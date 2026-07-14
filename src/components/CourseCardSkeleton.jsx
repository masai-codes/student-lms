import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export default function CourseCardSkeleton() {
  return (
    <Card className="rounded-lg animate-pulse">
      <CardHeader className="flex flex-row gap-4">
        {/* Course Logo Skeleton */}
        <Skeleton className="h-12 w-12 rounded-lg border" />

        {/* Course Title and Program Skeleton */}
        <div className="space-y-1 flex-1">
          <Skeleton className="h-5 w-3/4 rounded" /> {/* Course name */}
          <Skeleton className="h-4 w-1/2 rounded" /> {/* Program name */}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Progress Bar Skeleton */}
        <Skeleton className="h-2 w-full rounded" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Skeleton className="h-3 w-1/4 rounded" />{' '}
          {/* "Course Progress" text */}
          <Skeleton className="h-3 w-6 rounded" /> {/* Percentage text */}
        </div>
      </CardContent>

      <CardFooter className="flex gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />{' '}
        {/* Start Learning button */}
        <Skeleton className="h-8 w-24 rounded-lg" />{' '}
        {/* Course Details button */}
      </CardFooter>
    </Card>
  )
}
