import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react"
import { TabGroup } from '@/components/common'
import { FilterAndSeachBar as FilterAndSearchBar } from '@/components/common'
import SwitchCourse from '@/components/modals/SwitchCourse'


export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/_courseTabLayout'
)({
  pendingMs: 0,
  component: CourseLayout,
  
    loader: async ({ context }) => {
      const { user } = context
  
      return { user }
    }
})
function CourseLayout() {

  const [open, setOpen] = useState(false)


    const { user } = Route.useLoaderData()
   



  return (
    <div className="space-y-6">

      <div className='bg-white space-y-6 py-6 rounded-b-2xl border-b px-[clamp(16px,6.25vw,80px)]'>

        <div className='flex gap-4 items-center justify-between'>
          <div className='flex gap-4 items-center'>
            <h2 className="text-2xl font-semibold">Product Management with Generative & Agentic AI</h2>
            <div
              onClick={() => setOpen(!open)}
              className="h-8 w-8 bg-[#EBF5FF] flex items-center justify-center rounded-full cursor-pointer">
              {open ? <ChevronDown color="#6962AC" /> : <ChevronDown color="#6962AC" />}
            </div>
          </div>


            <p className='flex gap-1 text-[#6962AC] cursor-pointer'>
              Course Details
              <ChevronRight color="#6962AC"/>
            </p>
        </div>

        <div className='flex items-center justify-between'>
          <TabGroup />
          <FilterAndSearchBar referer="lectures_i" />
        </div>
      </div>

      {open && <SwitchCourse userId={user.id}/>}

      <div className="grid gap-6 px-[clamp(16px,6.25vw,80px)] mb-8">
        <Outlet />
      </div>
    </div>
  )
}