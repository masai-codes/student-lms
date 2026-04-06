import { useNavigate } from '@tanstack/react-router'
import type { DiscussionType } from '@/server/discussions/fetchAllDiscussionsByEntityId'
import { capitalize, formatSqlDate } from '@/utils/generics'


export function DiscussionCard({ discussion }: { discussion: DiscussionType }) {

  const navigate = useNavigate()

  const handleClick = () => {
    navigate({
      to: "/discussions/$discussionId",
      params: {
        discussionId: String(discussion.id),
      }
    })
  }


  return (
    <div onClick={handleClick} className="block">
      <div className='flex items-start gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-lg p-3'>
        <div>
          <p className='text-lg font-medium'>{discussion.title}</p>
          <div className='flex items-center gap-2 text-sm font-medium mt-2'>
            <p className='text-[#4B5563]'>Prof. Anvesh Jain</p>
            <p className='text-[#4B5563]'>&bull;</p>
            <p className='text-[#4B5563]'>{formatSqlDate(discussion.createdAt)}</p>
          </div>
          <div className='flex items-center gap-2 text-sm font-medium mt-2'>
            <p className='bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]'>{capitalize(discussion.entityType.split('\\').pop() || '')}</p>
            <p className='bg-[#F9FAFB] p-1 rounded-xl text-[#6C7280]'>{discussion.public === 0 ? 'Private' : 'Public'}</p>
            <p className={`p-1 rounded-xl ${discussion.isClosed === 0 ? 'bg-[#F4FAF7] text-[#0E9F6E]' : 'bg-[#FDF2F2] text-[#F05252]'}`}>
              {discussion.isClosed === 0 ? 'Ongoing' : 'Closed'}
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
