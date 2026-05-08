import { createFileRoute } from '@tanstack/react-router'
import { AppLoading } from '@/components/common'
import { WhatsNew } from '@/components/features/whats-new'
import { fetchWhatsNew } from '@/server/whats-new/fetchWhatsNew'

export const Route = createFileRoute('/(protected)/_layout/whats-new/')({
  component: RouteComponent,
  pendingComponent: () => <AppLoading fullPage label="Loading updates..." />,
  
    loader: async () => {
        const whatsnewData = await fetchWhatsNew()
    
        return { whatsnewData }
      }
})

function RouteComponent() {
    const {whatsnewData} = Route.useLoaderData()
  return (
    <WhatsNew whatsnew={whatsnewData[0]} />
  )
}
