import { createFileRoute } from '@tanstack/react-router'
import PagePlaceholder from '@/components/features/masaiverse-v2/pages/PagePlaceholder'

export const Route = createFileRoute('/(protected)/_layout/masaiverse/home')({
  component: () => (
    <PagePlaceholder
      title="Home"
      description="Your masaiverse home feed will appear here."
    />
  ),
})
