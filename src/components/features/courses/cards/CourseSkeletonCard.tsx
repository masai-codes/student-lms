import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CourseCardSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
      <CardFooter className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </CardFooter>
    </Card>
  )
}