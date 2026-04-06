import { createFileRoute } from '@tanstack/react-router'
import { ZoomMeeting } from '@/components/features/zoom'

export const Route = createFileRoute('/(protected)/zoom/')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
    <ZoomMeeting />
  )
}
