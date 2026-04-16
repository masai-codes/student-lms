import type { ClubType } from '@/server/masaiverse/fetchClubs'
import Disucssions from './CommunityDiscussions/Discussions'
import CommunityDiscussionsEmptyState from './CommunityDiscussionsEmptyState.tsx'

type CommunityDiscussionsProps = {
  hasJoinedClub: boolean
  isAdmin: boolean
  clubs: Array<ClubType>
  joinedClubId: string | null
  initialPostIdFromSearch?: string
  initialCreateDiscussionOpen?: boolean
}

export default function CommunityDiscussions({
  hasJoinedClub,
  isAdmin,
  clubs,
  joinedClubId,
  initialPostIdFromSearch,
  initialCreateDiscussionOpen,
}: CommunityDiscussionsProps) {
  const canViewDiscussions = hasJoinedClub || isAdmin

  return (
    <div className="mt-[24px] md:mt-[48px]">
      <h2 className="text-[18px] font-semibold text-[#111827]">
        Community Discussions
      </h2>
      <div className="mt-[12px]">
        {canViewDiscussions ? (
          <Disucssions
            isAdmin={isAdmin}
            clubs={clubs}
            joinedClubId={joinedClubId}
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
