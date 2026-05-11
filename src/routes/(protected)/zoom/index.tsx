import { createFileRoute, redirect } from '@tanstack/react-router'
import { ZoomMeeting } from '@/components/features/zoom'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

export const Route = createFileRoute('/(protected)/zoom/')({
  beforeLoad: async ({ location }) => {
    const user = await fetchCurrentUser()
    if (!user) {
      throw redirect({ to: '/signin' })
    }
    const oldUiUrl = getOldStudentUiUrlForPath(location.href)
    if (oldUiUrl) {
      throw redirect({ href: oldUiUrl })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return(
    <ZoomMeeting />
  )
}
