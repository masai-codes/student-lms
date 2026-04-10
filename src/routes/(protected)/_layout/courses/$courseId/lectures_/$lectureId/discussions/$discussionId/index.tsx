import { Await, createFileRoute } from '@tanstack/react-router'
import { ViewDiscussion } from '@/components/features/discussions'
import { Card } from '@/components/ui/card'
import { FilterAndSeachBar } from '@/components/common'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { SkeletonCommon } from '@/components/common'
import { fetchDiscussionById } from '@/server/discussions/fetchDiscussionById'
import { fetchDiscussionThreads } from '@/server/discussions/fetchDiscussionThreads'
import {ViewDiscussionThreads} from '@/components/features/discussions'
import { TextEditor } from '@/components/features/discussions'

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/lectures_/$lectureId/discussions/$discussionId/',
)({
  validateSearch: (search) => {
    const page =
      typeof search.page === 'number'
        ? search.page
        : Number(search.page)

    return {
      page: page && page > 0 ? page : undefined,
    }
  },
  component: RouteComponent,
  pendingComponent: () => {
    return (
      <Card className='p-6'>
        <div className="space-y-6">
          {/** TODO: Drop this H2 and FilterAndSeach component in a _layout */}
          <h2 className="text-2xl font-semibold">Discussions</h2>
          <FilterAndSeachBar referer='discussions_l_i' />
          {Array.from({ length: PAGINATION_PAGE_SIZE }).map((_, i) => (
            <SkeletonCommon key={i} />
          ))}
        </div>
      </Card>
    )
  },
  loaderDeps: ({ search: { page } }) => ({ page }),

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
    <>
      <ViewDiscussion discussion={discussionData[0]} />

      <Await promise={threadsPromise} fallback={<div>Loading...123</div>}>
        {(threads) => (
          <div className="bg-white border p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Responses</h2>

            <div className="space-y-4">
              {threads.map((thread, key) => (
                <ViewDiscussionThreads thread={thread} key={key} />
              ))}
            </div>
            <div className='mt-8'>
              <TextEditor />
            </div>
          </div>
        )}
      </Await>
    </>

  )
}
