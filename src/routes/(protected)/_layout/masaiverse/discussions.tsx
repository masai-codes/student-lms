import { createFileRoute } from '@tanstack/react-router'
import DiscussionsPage from '@/components/features/masaiverse-v2/pages/DiscussionsPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/discussions',
)({
  component: DiscussionsPage,
})
