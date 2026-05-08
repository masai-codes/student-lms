import { createFileRoute } from '@tanstack/react-router'
// import { Dashboard } from '@/components/features/dashboard'
import { AppLoading } from '@/components/common'
import { Dashboard } from '@/components/features/dashboard'
import { fetchWeeklySchedule } from '@/server/dashboard/fetchWeeklySchedule'
import { fetchPendingTasks } from '@/server/dashboard/fetchPendingTasks'
import { fetchAnnouncements } from '@/server/dashboard/fetchAnnouncements'

export const Route = createFileRoute('/(protected)/_layout/')({ 
  component: App,
  pendingComponent: () => <AppLoading fullPage label="Loading dashboard..." />,
  
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
    <div className="w-full">
        <Dashboard schedule={yourSchedule} pendingTasks={pendingTasks} announcements={announcements}  />
    </div>
  )
}
