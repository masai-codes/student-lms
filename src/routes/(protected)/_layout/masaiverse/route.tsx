import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import MasaiverseHomepage from '@/components/features/masaiverse/MasaiverseHomepage'
import { showMasaiversePage } from '@/server/masaiverse/showMasaiversePage'
import { redirectToOldStudentUi } from '@/utils/authRedirect'

export const Route = createFileRoute('/(protected)/_layout/masaiverse')({
  loader: async ({ context }) => {
    if (context.user.role === 'admin') {
      return { canShowMasaiverse: true }
    }

    const canShowMasaiverse = await showMasaiversePage({
      data: { userId: context.user.id },
    })
    return { canShowMasaiverse }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { canShowMasaiverse } = Route.useLoaderData()

  useEffect(() => {
    if (!canShowMasaiverse) {
      redirectToOldStudentUi()
    }
  }, [canShowMasaiverse])

  if (!canShowMasaiverse) return null

  return (
    <MasaiverseHomepage>
      <Outlet />
    </MasaiverseHomepage>
  )
}
