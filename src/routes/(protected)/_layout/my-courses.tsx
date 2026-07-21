import { createFileRoute } from '@tanstack/react-router'
import { MyCoursesPage } from '@/components/features/my-courses/MyCoursesPage'

export const Route = createFileRoute('/(protected)/_layout/my-courses')({
  component: MyCoursesPage,
})
