import Disucssions from './CommunityDiscussions/Discussions'
import CommunityDiscussionsEmptyState from './CommunityDiscussionsEmptyState.tsx'

type CommunityDiscussionsProps = {
  hasJoinedClub: boolean
}

export default function CommunityDiscussions({
  hasJoinedClub,
}: CommunityDiscussionsProps) {
  return (
    <div className="mt-[48px]">
      <h2 className="text-[18px] font-semibold text-[#111827]">
        Community Discussions
      </h2>
      <div className="mt-[12px]">
        {hasJoinedClub ? <Disucssions /> : <CommunityDiscussionsEmptyState />}
      </div>
    </div>
  )
}
