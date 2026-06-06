import CommunityDiscussionsSection from '../home/CommunityDiscussionsSection'
import type { MasaiverseV2Discussion } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'

type ClubDiscussionsSectionProps = {
  clubId: string
  /** Latest 5 club discussions embedded in the club detail payload. */
  discussions: Array<MasaiverseV2Discussion>
}

/**
 * Club page discussions — reuses the home community-discussions feed, scoped
 * to this club so only its posts show and new posts are tied to it. The latest
 * five come embedded in the club detail payload, so the feed renders without a
 * separate request and shows no pagination.
 */
export default function ClubDiscussionsSection({
  clubId,
  discussions,
}: ClubDiscussionsSectionProps) {
  return (
    <CommunityDiscussionsSection
      clubId={clubId}
      title="Club Discussion"
      preloadedDiscussions={discussions}
    />
  )
}
