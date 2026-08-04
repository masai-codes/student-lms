import { createFileRoute } from '@tanstack/react-router'
import { InterviewsPage } from '@/components/features/interviews/InterviewsPage'

export const Route = createFileRoute('/(protected)/_layout/interviews/')({
  component: InterviewsPage,
})
