import { createFileRoute } from '@tanstack/react-router'
import { MyCoursesPage } from '@/components/features/my-courses'

export const Route = createFileRoute('/(protected)/_layout/my-programs')({
  component: MyCoursesPage,
})
