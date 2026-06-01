import { createFileRoute } from '@tanstack/react-router'
import PagePlaceholder from '@/components/features/masaiverse-v2/pages/PagePlaceholder'

export const Route = createFileRoute('/(protected)/_layout/masaiverse/events')({
  component: () => (
    <PagePlaceholder
      title="Events"
      description="Upcoming masaiverse events will appear here."
    />
  ),
})
