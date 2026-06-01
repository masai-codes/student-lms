import { createFileRoute } from '@tanstack/react-router'
import PagePlaceholder from '@/components/features/masaiverse-v2/pages/PagePlaceholder'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/leaderboard',
)({
  component: () => (
    <PagePlaceholder
      title="Leaderboard"
      description="The masaiverse leaderboard will appear here."
    />
  ),
})
