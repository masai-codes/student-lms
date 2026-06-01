import { createFileRoute } from '@tanstack/react-router'
import PagePlaceholder from '@/components/features/masaiverse-v2/pages/PagePlaceholder'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/discussions',
)({
  component: () => (
    <PagePlaceholder
      title="Discussions"
      description="Community discussions will appear here."
    />
  ),
})
