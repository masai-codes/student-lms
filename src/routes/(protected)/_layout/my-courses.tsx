import { createFileRoute } from '@tanstack/react-router'

/** Blank slate — the page is being rebuilt from scratch. */
function MyCoursesPage() {
  return null
}

export const Route = createFileRoute('/(protected)/_layout/my-courses')({
  component: MyCoursesPage,
})
