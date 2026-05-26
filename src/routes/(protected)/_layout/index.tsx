import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/features/dashboard/layout/DashboardLayout'

export const Route = createFileRoute('/(protected)/_layout/')({
  component: DashboardPage,
})

function DashboardPage() {
  return <DashboardLayout />
}
