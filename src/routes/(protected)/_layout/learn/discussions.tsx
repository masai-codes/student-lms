import { createFileRoute } from '@tanstack/react-router'
import { LearnDiscussionsPage } from '@/components/features/learn/discussions/LearnDiscussionsPage'
import { listLearnDiscussionsViaApi } from '@/lib/api/learn/discussionsApi'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'

type LearnDiscussionsSearch = {
  batchId?: number
}

export const Route = createFileRoute('/(protected)/_layout/learn/discussions')({
  validateSearch: (search: Record<string, unknown>): LearnDiscussionsSearch => {
    const batchId =
      typeof search.batchId === 'number'
        ? search.batchId
        : typeof search.batchId === 'string' && search.batchId.trim() !== ''
          ? Number(search.batchId)
          : undefined
    return batchId != null && Number.isFinite(batchId) ? { batchId } : {}
  },
  loaderDeps: ({ search }) => ({ batchId: search.batchId }),
  loader: async ({ deps }) => {
    // Reuses the Learn page's own batch resolution (last-selected / first
    // enrolled) instead of re-deriving a default batch here.
    const pageData = await fetchLearnPageDataFromApi({
      batchId: deps.batchId,
      learningType: 'lecture',
      page: 1,
    })

    const discussions =
      pageData.selectedBatchId != null
        ? await listLearnDiscussionsViaApi(pageData.selectedBatchId)
        : []

    return { discussions }
  },
  component: LearnDiscussionsRoute,
})

function LearnDiscussionsRoute() {
  const { discussions } = Route.useLoaderData()
  return <LearnDiscussionsPage discussions={discussions} />
}
