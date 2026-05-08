import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LearnLayout } from '@/components/features/learn'
import { getEnrolledBatches } from '@/server/learn/getEnrolledBatches'

export const Route = createFileRoute('/(protected)/_layout/learn/')({
  validateSearch: (search) => {
    const batchId =
      typeof search.batchId === 'number'
        ? search.batchId
        : Number(search.batchId)

    return {
      batchId: batchId && batchId > 0 ? batchId : undefined,
    }
  },
  loader: async () => {
    const enrolledBatches = await getEnrolledBatches()
    return { enrolledBatches }
  },
  component: LearnPage,
})

function LearnPage() {
  const { batchId } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { enrolledBatches } = Route.useLoaderData()

  useEffect(() => {
    if (batchId != null || enrolledBatches.length === 0) {
      return
    }

    navigate({
      search: (prev) => ({
        ...prev,
        batchId: enrolledBatches[0].batchId,
      }),
      replace: true,
    })
  }, [batchId, enrolledBatches, navigate])

  return (
    <LearnLayout
      enrolledBatches={enrolledBatches}
      selectedBatchId={batchId}
      onBatchChange={(nextBatchId) => {
        navigate({
          search: (prev) => ({
            ...prev,
            batchId: nextBatchId,
          }),
          replace: true,
        })
      }}
    />
  )
}
