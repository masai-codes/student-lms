import { createFileRoute, redirect } from '@tanstack/react-router'
import { ZoomMeeting } from '@/components/features/zoom'
import {
  getOldStudentUiUrlForPath,
  isLegacyStudentRedirectEnabled,
} from '@/utils/authRedirect'

export const Route = createFileRoute('/(protected)/zoom/')({
  beforeLoad: ({ location }) => {
    if (!isLegacyStudentRedirectEnabled()) return

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
