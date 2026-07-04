import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/components/features/dashboard'

export const Route = createFileRoute('/(protected)/_layout/')({
  component: DashboardPage,
})
