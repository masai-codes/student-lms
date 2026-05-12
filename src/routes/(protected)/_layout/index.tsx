import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/_layout/')({
  beforeLoad: () => {
    throw redirect({ to: '/learn' })
  },
})
