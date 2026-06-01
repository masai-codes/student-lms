import { createFileRoute } from '@tanstack/react-router'
import HomePage from '@/components/features/masaiverse-v2/pages/HomePage'

export const Route = createFileRoute('/(protected)/_layout/masaiverse/home')({
  component: HomePage,
})
