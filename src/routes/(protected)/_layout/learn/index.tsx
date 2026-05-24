import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LearnLayout } from '@/components/features/learn'
import {
  getLastSelectedBatchIdForUser,
  setLastSelectedBatchIdForUser,
} from '@/lib/learnBatchSelection'
import { fetchEnrolledBatchesFromApi } from '@/lib/api/learn/learnApi'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

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
    const enrolledBatches = await fetchEnrolledBatchesFromApi()
    return { enrolledBatches }
  },
  component: LearnPage,
})

function LearnPage() {
  const { batchId } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { enrolledBatches } = Route.useLoaderData()
  const { user } = layoutRouteApi.useRouteContext()

  useEffect(() => {
    if (batchId != null || enrolledBatches.length === 0) {
      return
    }

    const storedBatchId = Number(getLastSelectedBatchIdForUser(user.id))
    const restoredBatchId =
      Number.isFinite(storedBatchId) &&
      storedBatchId > 0 &&
      enrolledBatches.some((batch) => batch.batchId === storedBatchId)
        ? storedBatchId
        : enrolledBatches[0].batchId

    navigate({
      search: (prev) => ({
        ...prev,
        batchId: restoredBatchId,
      }),
      replace: true,
    })
  }, [batchId, enrolledBatches, navigate, user.id])

  useEffect(() => {
    if (batchId == null) {
      return
    }

    const isEnrolled = enrolledBatches.some((batch) => batch.batchId === batchId)
    if (!isEnrolled) {
      return
    }

    setLastSelectedBatchIdForUser(user.id, batchId)
  }, [batchId, enrolledBatches, user.id])

  return (
    <LearnLayout
      enrolledBatches={enrolledBatches}
      selectedBatchId={batchId}
      onBatchChange={(nextBatchId) => {
        setLastSelectedBatchIdForUser(user.id, nextBatchId)
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
