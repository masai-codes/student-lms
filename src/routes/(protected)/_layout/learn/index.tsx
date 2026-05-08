import { createFileRoute } from '@tanstack/react-router'
import { LearnLayout } from '@/components/features/learn'
import { getEnrolledBatches } from '@/server/learn/getEnrolledBatches'

export const Route = createFileRoute('/(protected)/_layout/learn/')({
  loader: async () => {
    const enrolledBatches = await getEnrolledBatches()
    return { enrolledBatches }
  },
  component: LearnPage,
})

function LearnPage() {
  const { enrolledBatches } = Route.useLoaderData()
  return <LearnLayout enrolledBatches={enrolledBatches} />
}
