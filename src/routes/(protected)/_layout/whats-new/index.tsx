import { createFileRoute } from '@tanstack/react-router'
import { WhatsNew } from '@/components/features/whats-new'
import { fetchWhatsNew } from '@/server/whats-new/fetchWhatsNew'

export const Route = createFileRoute('/(protected)/_layout/whats-new/')({
  component: RouteComponent,
  pendingComponent: () => {
      return (
        <div className="p-6 space-y-6">
          Loding890.....xcgtdo
        </div>
      )
    },
  
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
