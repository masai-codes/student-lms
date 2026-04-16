import Disucssions from './CommunityDiscussions/Discussions'
import CommunityDiscussionsEmptyState from './CommunityDiscussionsEmptyState.tsx'

type CommunityDiscussionsProps = {
  hasJoinedClub: boolean
  initialPostIdFromSearch?: string
  initialCreateDiscussionOpen?: boolean
}

export default function CommunityDiscussions({
  hasJoinedClub,
  initialPostIdFromSearch,
  initialCreateDiscussionOpen,
}: CommunityDiscussionsProps) {
  return (
    <div className="mt-[24px] md:mt-[48px]">
      <h2 className="text-[18px] font-semibold text-[#111827]">
        Community Discussions
      </h2>
      <div className="mt-[12px]">
        {hasJoinedClub ? (
          <Disucssions
            initialPostIdFromSearch={initialPostIdFromSearch}
            initialCreateDiscussionOpen={initialCreateDiscussionOpen}
          />
        ) : (
          <CommunityDiscussionsEmptyState />
        )}
      </div>
    </div>
  )
}
