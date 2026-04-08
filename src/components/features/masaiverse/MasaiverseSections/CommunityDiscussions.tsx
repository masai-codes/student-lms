import Disucssions from './CommunityDiscussions/Discussions'

type CommunityDiscussionsProps = {
  hasJoinedClub: boolean
}

export default function CommunityDiscussions({
  hasJoinedClub,
}: CommunityDiscussionsProps) {
  return (
    <div className="mt-8">
      <h2 className="text-[18px] font-semibold text-[#111827]">
        Community Discussions
      </h2>
      <div className="mt-[12px]">
        {hasJoinedClub ? (
          <Disucssions />
        ) : (
          <p className="mt-2 text-sm text-[#6B7280]">
            Join a club to start discussion.
          </p>
        )}
      </div>
    </div>
  )
}
