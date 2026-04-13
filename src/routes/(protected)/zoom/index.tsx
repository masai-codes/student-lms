import { createFileRoute, redirect } from '@tanstack/react-router'
import { ZoomMeeting } from '@/components/features/zoom'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

export const Route = createFileRoute('/(protected)/zoom/')({
  beforeLoad: ({ location }) => {
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
