import { createFileRoute } from '@tanstack/react-router'
// import { Dashboard } from '@/components/features/dashboard'
import { Dashboard } from '@/components/features/dashboard'
import { fetchWeeklySchedule } from '@/server/dashboard/fetchWeeklySchedule'
import { fetchPendingTasks } from '@/server/dashboard/fetchPendingTasks'
import { fetchAnnouncements } from '@/server/dashboard/fetchAnnouncements'

export const Route = createFileRoute('/(protected)/_layout/')({ 
  component: App,
  pendingComponent: () => {
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">LOading...</h2>
        </div>
      )
    },
  
    loader: ({ context }) => {
        const { user } = context

        const pendingTasks = fetchPendingTasks({ data: {userId: user.id} })
        const yourSchedule = fetchWeeklySchedule({ data: {userId: user.id} })
        const announcements = fetchAnnouncements({ data: {userId: user.id} })
    
        return { yourSchedule, pendingTasks, announcements }
      }
})

function App() {

  const { yourSchedule, pendingTasks, announcements } = Route.useLoaderData()

  return (
    <div className="min-h-screen px-[clamp(16px,6.25vw,80px)]">
        <Dashboard schedule={yourSchedule} pendingTasks={pendingTasks} announcements={announcements}  />
    </div>
  )
}
