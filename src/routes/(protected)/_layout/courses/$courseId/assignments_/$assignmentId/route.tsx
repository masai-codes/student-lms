import { Link, Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { AssignmentsType } from '@/server/assignments/fetchAllAssignments'
import { Badge } from "@/components/ui/badge"
import { fetchAssignmentById } from '@/server/assignments/fetchAssignmentById'
import { cn } from "@/lib/utils"
import { formatSqlDate } from '@/utils/generics'

const linkBase =
  "px-6 py-3 font-semibold transition-all"

const linkInactive =
  "text-[#6C7280] hover:text-[#6962AC] hover:white"

const linkActive =
  "text-[#6962AC] bg-white border rounded-t-xl"

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/assignments_/$assignmentId',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const assignmentId = Number(params.assignmentId)

    const assignmentData = await fetchAssignmentById({
      data: { assignmentId },
    })

    return { assignmentData }
  }
})

function RouteComponent() {

  const tabButtons = [
    { key: "assignment", label: "Assignment Details", to: '/courses/$courseId/assignments/$assignmentId' },
    { key: "discussion", label: "Discussions", to: '/courses/$courseId/assignments/$assignmentId/discussions' },
  ]

  const data = Route.useLoaderData();

  const { useParams } = getRouteApi('/(protected)/_layout/courses/$courseId/assignments_/$assignmentId')

  const { courseId, assignmentId } = useParams()

  const { assignmentData } = data;

  return (
    <div className='w-full py-6'>

      <AssignmentDetailHeader
        data={assignmentData[0]}
      />


      <div className="flex flex-col flex-1">
        <div className="flex">
          {tabButtons.map((tab) => (
            <Link
              to={tab.to}
              key={tab.key}
              params={{ courseId, assignmentId }}
              className={cn(linkBase, linkInactive)}
              activeOptions={{ exact: true }} // 👈 IMPORTANT
              activeProps={{
                className: cn(linkBase, linkActive),
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  )
}





interface AssignmentDetailHeaderProps {
  data: AssignmentsType
}

export function AssignmentDetailHeader({
  data,
}: AssignmentDetailHeaderProps) {
  return (
    <div className="space-y-4 mb-8">
      <h1 className="text-2xl font-bold">
        {data.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[#4B5563]">
        <p>Prof. Anvesh Jain</p>
        <p>&bull;</p>
        <p>{formatSqlDate(data.schedule)}</p>
        <p>-</p>
        <p>{formatSqlDate(data.concludes)}</p>
        <Badge variant="secondary" className='bg-white text-[#4B5563]'>
          {data.tags}
        </Badge>
        {data.optional === 0 ? (
          <Badge variant="secondary" className="bg-white text-[#4B5563]">
            Mandatory
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-white text-[#4B5563]">
            Recommended
          </Badge>
        )}
        {/* <Badge variant="secondary" className='bg-white text-[#4B5563]'>
          {data.module}
        </Badge> */}

      </div>
    </div>
  )
}



