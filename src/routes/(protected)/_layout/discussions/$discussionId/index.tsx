import { Await, createFileRoute } from '@tanstack/react-router'
import { ViewDiscussion } from '@/components/features/discussions'
import { fetchDiscussionById } from '@/server/discussions/fetchDiscussionById'
import { fetchDiscussionThreads } from '@/server/discussions/fetchDiscussionThreads'
import { ViewDiscussionThreads, ZeroDiscussionThreads } from '@/components/features/discussions'
import { TextEditor } from '@/components/features/discussions'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute(
  '/(protected)/_layout/discussions/$discussionId/',
)({
  component: RouteComponent,
  pendingComponent: () => {
    return (
      <DiscussionDetailSkeleton />
    )
  },

  loader: async ({ params }) => {
    const { discussionId } = params

    // Background and main call
    const threadsPromise = fetchDiscussionThreads({ data: { discussionId: JSON.parse(discussionId) } })

    const discussionData = await fetchDiscussionById({
      data: { discussionId: JSON.parse(discussionId) },
    })

    return { threadsPromise, discussionData }
  }
})

function RouteComponent() {

  const data = Route.useLoaderData();

  const { threadsPromise, discussionData } = data;

  return (
    <div className='w-full py-6'>
      <ViewDiscussion discussion={discussionData[0]} />

      <Await promise={threadsPromise} fallback={<ResponsesSkeleton />}>
        {(threads) => (
          <div className="bg-white border mt-4 p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Responses</h2>

            {threads.length === 0 ? (
              <ZeroDiscussionThreads />
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <ViewDiscussionThreads
                    key={thread.id}
                    thread={thread}
                  />
                ))}
              </div>
            )}

            <div className="mt-8">
              <TextEditor />
            </div>
          </div>
        )}
      </Await>
    </div>
  )
}





function DiscussionDetailSkeleton() {
  return (
    <div className="w-full py-6 space-y-4">
      {/* Main discussion */}
      <div className="p-6 space-y-4 bg-white rounded-xl border">
        <Skeleton className="h-6 w-3/4 bg-muted/60" />
        <Skeleton className="h-4 w-full bg-muted/60" />
        <Skeleton className="h-4 w-5/6 bg-muted/60" />

        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-24 bg-muted/60" />
          <Skeleton className="h-4 w-20 bg-muted/60" />
        </div>
      </div>

      {/* Responses */}
      <ResponsesSkeleton />
    </div>
  )
}


function ResponsesSkeleton() {
  return (
    <div className="bg-white border p-4 rounded-xl space-y-6 mt-4">
      <Skeleton className="h-6 w-32 bg-muted/60" />

      {/* Threads */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3"
          >
            <Skeleton className="h-4 w-1/3 bg-muted/60" />
            <Skeleton className="h-4 w-full bg-muted/60" />
            <Skeleton className="h-4 w-5/6 bg-muted/60" />

            <div className="flex gap-3 pt-1">
              <Skeleton className="h-3 w-16 bg-muted/60" />
              <Skeleton className="h-3 w-12 bg-muted/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Text editor */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-muted/60" />
        <Skeleton className="h-28 w-full rounded-lg bg-muted/60" />
      </div>
    </div>
  )
}