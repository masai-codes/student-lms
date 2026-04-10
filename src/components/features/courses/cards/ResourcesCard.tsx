// components/shared/resourceCard.tsx
import { useNavigate } from '@tanstack/react-router'
import type { ResourceType } from '@/server/resources/fetchAllResources'
import { capitalize, formatSqlDate } from '@/utils/generics'


export function ResourceCard({ resource }: { resource: ResourceType }) {

  const navigate = useNavigate()
  
      const handleClick = () => {
  
          navigate({
              to: "/courses/$courseId/resources/$resourceId",
              params: { courseId: JSON.stringify(resource.batchId), resourceId: JSON.stringify(resource.id)},
          })
      }

  return (
    <div onClick={handleClick} className="block">
          <div className='flex items-start gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-lg p-3'>
            <img className='mt-[0.25em] h-8 px-2' src='/ResourceIcon.svg' alt="resource-icon" />
            <div>
              <p className='text-lg font-medium'>{resource.title}</p>
              <div className='flex items-center gap-2 text-sm font-medium mt-2'>
                <p className='text-[#4B5563]'>Prof. Anvesh Jain</p>
                <p className='text-[#4B5563]'>&bull;</p>
                <p className='text-[#4B5563]'>{formatSqlDate(resource.schedule)}</p>
              </div>
              <div className='flex items-center gap-2 text-sm font-medium mt-2'>
                <p className='bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]'>{capitalize(resource.category)}</p>
                {resource.optional === 0 ? (
                  <p className="bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]">
                    Mandatory
                  </p>
                ) : (
                  <p className="bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]">
                    Recommended
                  </p>
                )}
                {/* <p className='bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]'>{capitalize(resource.module)}</p> */}
              </div>
            </div>
          </div>
        </div>
  )
}
