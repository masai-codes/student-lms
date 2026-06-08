import { createFileRoute } from '@tanstack/react-router'
import EventsPage from '@/components/features/masaiverse-v2/pages/EventsPage'

export const Route = createFileRoute('/(protected)/_layout/masaiverse/events')({
  component: EventsPage,
})
