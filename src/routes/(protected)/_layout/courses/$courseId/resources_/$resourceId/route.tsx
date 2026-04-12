import { Link, Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { ResourceType } from '@/server/resources/fetchAllResources'
import { Badge } from "@/components/ui/badge"
import { fetchResourceById } from '@/server/resources/fetchResourceById'
import { formatSqlDate } from '@/utils/generics'
import { cn } from '@/lib/utils'


const linkBase =
  "px-6 py-3 font-semibold transition-all"

const linkInactive =
  "text-[#6C7280] hover:text-[#6962AC] hover:white"

const linkActive =
  "text-[#6962AC] bg-white border rounded-t-xl"


export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/resources_/$resourceId',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
      const resourceId = Number(params.resourceId)
  
      const resourceData = await fetchResourceById({
        data: { resourceId },
      })
      return { resourceData }
    }
})

function RouteComponent() {

    const { useParams } = getRouteApi('/(protected)/_layout/courses/$courseId/resources_/$resourceId')
  
    const { courseId, resourceId } = useParams()

  const tabButtons = [
    { key: "resource", label: "Description", to: '/courses/$courseId/resources/$resourceId' },
    { key: "discussion", label: "Discussions", to: '/courses/$courseId/resources/$resourceId/discussions' },
  ]

  const data = Route.useLoaderData();
  
    const { resourceData } = data;


  return (
    <div className='w-full py-6'>
    
          <ResourceDetailHeader
            data={resourceData[0]}
          />
    
    
          <div className="flex flex-col flex-1">
            <div className="flex">
              {tabButtons.map((tab) => (
                <Link
                  to={tab.to}
                  key={tab.key}
                  params={{ courseId, resourceId }}
                  className={cn(linkBase, linkInactive)}
                  activeOptions={{ exact: true }}
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




interface ResourceDetailHeaderProps {
  data: ResourceType
}

export function ResourceDetailHeader({
  data,
}: ResourceDetailHeaderProps) {
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



