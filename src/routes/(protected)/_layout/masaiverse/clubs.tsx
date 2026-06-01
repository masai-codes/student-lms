import { createFileRoute } from '@tanstack/react-router'
import ClubsPage from '@/components/features/masaiverse-v2/pages/ClubsPage'

export const Route = createFileRoute('/(protected)/_layout/masaiverse/clubs')({
  component: ClubsPage,
})
