import { createFileRoute } from '@tanstack/react-router'
import { LearnLayout } from '@/components/features/learn'

export const Route = createFileRoute('/(protected)/_layout/learn/')({
  component: LearnPage,
})

function LearnPage() {
  return <LearnLayout />
}
